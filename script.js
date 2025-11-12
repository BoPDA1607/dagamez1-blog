document.addEventListener('DOMContentLoaded', () => {

    // --- Initialize Lucide Icons ---
    lucide.createIcons();

    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Set initial theme on page load
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
    } else {
        htmlEl.classList.add('light');
        htmlEl.classList.remove('dark');
    }

    // Add click listener for theme toggle
    themeToggleBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('dark')) {
            htmlEl.classList.remove('dark');
            htmlEl.classList.add('light');
            localStorage.theme = 'light';
        } else {
            htmlEl.classList.add('dark');
            htmlEl.classList.remove('light');
            localStorage.theme = 'dark';
        }
        lucide.createIcons(); // Redraw icons
    });
    
    // --- Blog Management ---
    const blogListView = document.getElementById('blog-list-view');
    const blogSingleView = document.getElementById('blog-single-view');
    const blogCardsContainer = document.getElementById('blog-cards-container');
    const backToListBtn = document.getElementById('back-to-list');
    
    const blogTitleEl = document.getElementById('blog-title');
    const blogMetaEl = document.getElementById('blog-meta');
    const blogBodyEl = document.getElementById('blog-body');
    const blogHeaderImage = document.getElementById('blog-header-image');
    
    // --- Language Switcher ---
    const langSwitcher = document.getElementById('language-switcher');
    const langButtons = langSwitcher.querySelectorAll('[data-lang-button]');
    let currentLang = 'vi';
    let currentPostId = null;

    /**
     * Format date string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        
        if (currentLang === 'vi') {
            return `Ngày ${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
        } else {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
    }

    /**
     * Create a blog card
     */
    function createBlogCard(post) {
        const translation = post.translations[currentLang] || post.translations['vi'] || post.translations['en'];
        
        if (!translation) {
            return null; // Skip if no translation available
        }

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl';
        card.onclick = () => showPost(post.id);

        card.innerHTML = `
            <img 
                src="${post.image || 'https://placehold.co/600x400/6366f1/ffffff?text=Blog+Post'}" 
                alt="${translation.title}"
                class="w-full h-48 object-cover"
                onerror="this.src='https://placehold.co/600x400/ef4444/ffffff?text=Image+Error'"
            >
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white">
                    ${translation.title}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    ${translation.excerpt || 'Không có mô tả...'}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span class="flex items-center">
                        <i data-lucide="user" class="w-3 h-3 mr-1"></i>
                        ${post.author || 'dagamez1'}
                    </span>
                    <span class="flex items-center">
                        <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
                        ${formatDate(post.createdAt)}
                    </span>
                </div>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mt-3">
                        ${post.tags.slice(0, 3).map(tag => `
                            <span class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs rounded-full">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return card;
    }

    /**
     * Load and display all blog posts
     */
    async function loadBlogList() {
        const posts = await BlogStorage.getAllPosts();
        
        blogCardsContainer.innerHTML = '';
        
        if (posts.length === 0) {
            blogCardsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="inbox" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400 text-lg">Chưa có bài viết nào</p>
                    <a href="admin.html" class="inline-flex items-center space-x-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        <i data-lucide="plus" class="w-5 h-5"></i>
                        <span>Đăng bài viết đầu tiên</span>
                    </a>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        posts.forEach(post => {
            const card = createBlogCard(post);
            if (card) {
                blogCardsContainer.appendChild(card);
            }
        });

        lucide.createIcons();
    }

    /**
     * Show a single blog post
     */
    async function showPost(postId) {
        const post = await BlogStorage.getPost(postId);
        
        if (!post) {
            alert('Không tìm thấy bài viết!');
            return;
        }

        currentPostId = postId;
        const translation = post.translations[currentLang] || post.translations['vi'] || post.translations['en'];

        if (!translation) {
            alert('Bài viết chưa có bản dịch cho ngôn ngữ này!');
            return;
        }

        // Update content
        blogTitleEl.textContent = translation.title;
        blogHeaderImage.src = post.image || 'https://placehold.co/1200x600/6366f1/ffffff?text=Blog+Post';
        
        blogMetaEl.innerHTML = `
            <div class="flex items-center space-x-4 text-sm">
                <span class="flex items-center">
                    <i data-lucide="user" class="w-4 h-4 mr-1"></i>
                    <strong class="text-indigo-600 dark:text-indigo-400">${post.author || 'dagamez1'}</strong>
                </span>
                <span class="flex items-center">
                    <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                    ${formatDate(post.createdAt)}
                </span>
            </div>
            ${post.tags && post.tags.length > 0 ? `
                <div class="flex flex-wrap gap-2 mt-3">
                    ${post.tags.map(tag => `
                        <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs rounded-full">
                            ${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Convert markdown to HTML
        blogBodyEl.innerHTML = marked.parse(translation.content);

        // Switch views
        blogListView.classList.add('hidden');
        blogSingleView.classList.remove('hidden');
        
        // Update page lang
        document.documentElement.lang = currentLang;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        lucide.createIcons();
    }

    /**
     * Go back to blog list
     */
    function showBlogList() {
        currentPostId = null;
        blogSingleView.classList.add('hidden');
        blogListView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Back to list button
    backToListBtn.addEventListener('click', showBlogList);

    // Language switcher
    langSwitcher.addEventListener('click', (e) => {
        const button = e.target.closest('[data-lang-button]');
        if (!button) return;

        const lang = button.dataset.langButton;
        currentLang = lang;

        // Update button active state
        langButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Reload current view
        if (currentPostId) {
            showPost(currentPostId);
        } else {
            loadBlogList();
        }
    });

    // Handle URL parameters (for direct linking to posts)
    const urlParams = new URLSearchParams(window.location.search);
    const postIdParam = urlParams.get('post');
    const langParam = urlParams.get('lang');

    if (langParam && ['vi', 'en'].includes(langParam)) {
        currentLang = langParam;
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langButton === langParam);
        });
    }

    // Initial load
    if (postIdParam) {
        showPost(postIdParam);
    } else {
        loadBlogList();
    }

});