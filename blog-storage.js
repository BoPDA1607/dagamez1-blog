// Blog Storage Manager
// Quản lý việc lưu trữ và truy xuất bài blog từ file JSON

const BlogStorage = {
    // File lưu trữ dữ liệu
    DATA_FILE: 'posts.json',
    
    /**
     * Lấy tất cả bài blog từ file
     * @returns {Promise<Array>} Mảng các bài blog
     */
    async getAllPosts() {
        try {
            const response = await fetch(this.DATA_FILE + '?t=' + Date.now()); // Cache busting
            if (!response.ok) {
                console.warn('File posts.json not found, returning empty array');
                return [];
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error reading posts:', error);
            return [];
        }
    },
    
    /**
     * Lấy một bài blog theo ID
     * @param {string} postId - ID của bài blog
     * @returns {Promise<Object|null>} Bài blog hoặc null nếu không tìm thấy
     */
    async getPost(postId) {
        const posts = await this.getAllPosts();
        return posts.find(post => post.id === postId) || null;
    },
    
    /**
     * Lưu một bài blog mới
     * LƯU Ý: Chức năng này chỉ download file JSON mới cho người dùng
     * Người dùng cần tự upload file posts.json lên server
     * @param {Object} post - Dữ liệu bài blog
     * @returns {Promise<Object>} Bài blog đã lưu
     */
    async savePost(post) {
        const posts = await this.getAllPosts();
        
        // Tạo ID nếu chưa có
        if (!post.id) {
            post.id = this.generateId();
        }
        
        // Thêm timestamp
        post.createdAt = post.createdAt || new Date().toISOString();
        post.updatedAt = new Date().toISOString();
        
        // Kiểm tra xem bài đã tồn tại chưa
        const existingIndex = posts.findIndex(p => p.id === post.id);
        
        if (existingIndex >= 0) {
            // Cập nhật bài cũ
            posts[existingIndex] = post;
        } else {
            // Thêm bài mới
            posts.unshift(post); // Thêm vào đầu mảng
        }
        
        // Tạo file JSON để download
        this.downloadJSON(posts);
        
        return post;
    },
    
    /**
     * Tạo file JSON và tự động download cho người dùng
     * @param {Array} posts - Danh sách bài viết
     */
    downloadJSON(posts) {
        const jsonStr = JSON.stringify(posts, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('File posts.json đã được download. Vui lòng upload file này lên server để cập nhật blog.');
    },
    
    /**
     * Xóa một bài blog
     * @param {string} postId - ID của bài blog cần xóa
     * @returns {Promise<void>}
     */
    async deletePost(postId) {
        let posts = await this.getAllPosts();
        posts = posts.filter(post => post.id !== postId);
        
        // Tạo file JSON để download
        this.downloadJSON(posts);
    },
    
    /**
     * Tạo ID ngẫu nhiên cho bài blog
     * @returns {string} ID duy nhất
     */
    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Tìm kiếm bài blog
     * @param {string} query - Từ khóa tìm kiếm
     * @param {string} lang - Ngôn ngữ (tùy chọn)
     * @returns {Promise<Array>} Danh sách bài blog phù hợp
     */
    async searchPosts(query, lang = null) {
        let posts = await this.getAllPosts();
        
        if (!query && !lang) return posts;
        
        return posts.filter(post => {
            // Lọc theo ngôn ngữ nếu có
            if (lang && !post.translations[lang]) {
                return false;
            }
            
            // Tìm kiếm trong title và content
            if (query) {
                const searchLower = query.toLowerCase();
                for (let langKey in post.translations) {
                    const translation = post.translations[langKey];
                    if (translation.title.toLowerCase().includes(searchLower) ||
                        translation.content.toLowerCase().includes(searchLower)) {
                        return true;
                    }
                }
                return false;
            }
            
            return true;
        });
    }
};

// KHÔNG CÓ CODE KHỞI TẠO/XÓA DỮ LIỆU TỰ ĐỘNG
// Dữ liệu chỉ được thêm/xóa qua trang Admin
