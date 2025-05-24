function createPagination(pagination, onPageChange) {
    let paginator = document.createElement('div');
    paginator.id = 'pagination';
    paginator.className = 'pagination mt-4';

    //Pagination element, disable 'Previous' /'Next' if there're no previous or next pages:
    paginator.innerHTML = `
            <ul class="pagination justify-content-center">
                <li class="page-item ${!pagination.has_previous ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${pagination.current_page - 1}">Previous</a>
                </li>
                <li class="page-item disabled">
                    <span class="page-link">Page ${pagination.current_page} of ${pagination.total_pages}</span>
                </li>
                <li class="page-item ${!pagination.has_next ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${pagination.current_page + 1}">Next</a>
                </li>
            </ul>
    `;

    //Attach event listeners unless page link is disabled:
    paginator.querySelectorAll('.page-link').forEach(link => {
        if (link.parentElement.classList.contains('disabled')) return;
        link.addEventListener('click', (e) => {
            //Prevent default jumping to the page top (href="#"):
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            //Load the target page:
            onPageChange(page);
            //Add timeout to ensure headers are loaded,
            //and auto scroll to header
            setTimeout(() => {
                const header = document.querySelector('h3');
                if (header) {header.scrollIntoView({ behavior: 'smooth' });}
            }, 100);
        });
    });

    return paginator;
}

export { createPagination };