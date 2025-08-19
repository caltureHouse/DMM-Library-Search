document.addEventListener('DOMContentLoaded', async function() {
    const resultsContainer = document.getElementById('resultsContainer');
    const searchInput = document.getElementById('searchInput');
    let books = [];

    const UI = {
        loading: `
            <div class="loading-container">
                <div class="text-center">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="mt-3">جاري تحميل البيانات، الرجاء الانتظار...</p>
                </div>
            </div>`,
        
        error: (message, details = '') => `
            <div class="alert alert-danger text-center" style="grid-column: 1/-1">
                <h4><i class="fas fa-exclamation-triangle me-2"></i>حدث خطأ</h4>
                <p>${message}</p>
                ${details ? `<small class="text-muted">${details}</small>` : ''}
                <button class="btn btn-sm btn-outline-secondary mt-3" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> إعادة المحاولة
                </button>
            </div>`,
        
        noResults: `
            <div class="no-results" style="grid-column: 1/-1">
                <i class="fas fa-info-circle fa-2x mb-3"></i>
                <h4>لا توجد نتائج مطابقة</h4>
                <p>حاول استخدام مصطلحات بحث مختلفة</p>
            </div>`
    };

   let page = 1;
const pageSize = 50;
let currentBooks = [];

function displayResults(booksToDisplay, reset = true) {
    if (reset) {
        resultsContainer.innerHTML = '';
        page = 1;
        currentBooks = booksToDisplay;
    }

    if (!currentBooks || currentBooks.length === 0) {
        resultsContainer.innerHTML = UI.noResults;
        return;
    }

    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    const booksPage = currentBooks.slice(start, end);

    booksPage.forEach(book => {
        const card = document.createElement('div');
        card.className = "book-card";
        card.innerHTML = `
            <div class="book-header">${book['العنوان'] || 'عنوان غير متوفر'}</div>
            <div class="book-body">
                <p><span class="field-label">رقم الطلب:</span>
                   <span class="field-value">${book['رقم الطلب'] || 'غير معروف'}</span></p>
                <p><span class="field-label">الفئة:</span>
                   <span class="field-value">${book['الفئة'] || 'غير معروف'}</span></p>
                <p><span class="field-label">الصنف:</span>
                   <span class="field-value">${book['الصنف'] || 'غير معروف'}</span></p>
                ${book['الترميز العمودي'] ? `
                <p><span class="field-label">الترميز العمودي:</span>
                   <span class="field-value">${book['الترميز العمودي']}</span></p>` : ''}
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (page * pageSize < currentBooks.length) {
            page++;
            displayResults(currentBooks, false);
        }
    }
});


    async function loadData() {
        try {
            resultsContainer.innerHTML = UI.loading;
            
            const response = await fetch('قائمة الدمام.xlsx');
            if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
            
            const contentType = response.headers.get('content-type');
            if (!contentType.includes('spreadsheet')) throw new Error('الملف ليس بصيغة Excel صحيحة');
            
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) throw new Error('الملف لا يحتوي على أي أوراق عمل');
            
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            books = XLSX.utils.sheet_to_json(firstSheet);
            
            if (books.length === 0) throw new Error('ورقة العمل لا تحتوي على بيانات');
            
            displayResults(books);
            
        } catch (error) {
            console.error('تفاصيل الخطأ:', error);
            const errorDetails = {
                'Error: NetworkError': 'تأكد من اتصال الإنترنت',
                'Error: 404': 'الملف غير موجود في المسار المحدد',
                'Error: 403': 'صلاحيات غير كافية لقراءة الملف',
                'Error: Invalid file': 'تأكد أن الملف بصيغة .xlsx صحيحة'
            };
            const userMessage = errorDetails[`Error: ${error.message}`] || 'حدث خطأ غير متوقع أثناء تحميل البيانات';
            resultsContainer.innerHTML = UI.error(userMessage, error.message);
        }
    }

    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim().toLowerCase();
            const filteredBooks = query ? books.filter(book =>
                (book['العنوان'] && book['العنوان'].toLowerCase().includes(query)) ||
                (book['رقم الطلب'] && book['رقم الطلب'].toString().toLowerCase().includes(query))
            ) : books;
            displayResults(filteredBooks);
        }, 300);
    });

    await loadData();
});
