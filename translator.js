// Translator Module
// Tự động dịch nội dung blog sang nhiều ngôn ngữ

const Translator = {
    // API key cho dịch vụ (có thể dùng Google Translate API, DeepL, etc.)
    // Hiện tại sử dụng MyMemory Translation API (free, không cần key)
    API_URL: 'https://api.mymemory.translated.net/get',
    
    /**
     * Dịch văn bản từ ngôn ngữ này sang ngôn ngữ khác
     * @param {string} text - Văn bản cần dịch
     * @param {string} targetLang - Ngôn ngữ đích (vi, en, cn, kr, jp)
     * @param {string} sourceLang - Ngôn ngữ nguồn (mặc định: auto)
     * @returns {Promise<string>} Văn bản đã dịch
     */
    async translate(text, targetLang, sourceLang = 'auto') {
        if (!text || text.trim().length === 0) {
            return '';
        }
        
        // Chuyển đổi mã ngôn ngữ
        const langMap = {
            'vi': 'vi-VN',
            'en': 'en-US',
            'cn': 'zh-CN',
            'kr': 'ko-KR',
            'jp': 'ja-JP'
        };
        
        const target = langMap[targetLang] || targetLang;
        const source = sourceLang === 'auto' ? 'auto' : (langMap[sourceLang] || sourceLang);
        
        try {
            // Chia nhỏ văn bản nếu quá dài (API có giới hạn)
            const chunks = this.splitText(text, 400);
            const translatedChunks = [];
            
            for (let chunk of chunks) {
                let translatedText = chunk;
                
                // Nếu dịch trực tiếp không được, thử dịch qua tiếng Anh
                try {
                    translatedText = await this.directTranslate(chunk, source, target);
                } catch (error) {
                    console.warn(`Direct translation failed for ${source} -> ${target}, trying via English...`);
                    
                    // Fallback: Dịch qua tiếng Anh trung gian
                    if (targetLang !== 'en' && sourceLang !== 'en') {
                        try {
                            const toEnglish = await this.directTranslate(chunk, source, 'en-US');
                            translatedText = await this.directTranslate(toEnglish, 'en-US', target);
                            console.log(`Successfully translated via English: ${targetLang}`);
                        } catch (fallbackError) {
                            console.error(`Fallback translation also failed:`, fallbackError);
                            translatedText = chunk; // Giữ nguyên nếu thất bại
                        }
                    } else {
                        translatedText = chunk;
                    }
                }
                
                translatedChunks.push(translatedText);
                
                // Delay để tránh rate limit
                await this.delay(500);
            }
            
            return translatedChunks.join(' ');
            
        } catch (error) {
            console.error('Translation failed:', error);
            return text; // Trả về văn bản gốc nếu dịch thất bại
        }
    },
    
    /**
     * Thực hiện dịch trực tiếp qua API
     * @param {string} text - Văn bản cần dịch
     * @param {string} source - Mã ngôn ngữ nguồn
     * @param {string} target - Mã ngôn ngữ đích
     * @returns {Promise<string>} Văn bản đã dịch
     */
    async directTranslate(text, source, target) {
        const url = `${this.API_URL}?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`Translation API response for ${source} -> ${target}:`, data);
        
        if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else if (data.responseStatus === 403) {
            throw new Error('API rate limit exceeded');
        } else {
            throw new Error(`Translation failed: ${data.responseStatus} - ${data.responseMessage || 'Unknown error'}`);
        }
    },
    
    /**
     * Dịch toàn bộ bài blog sang ngôn ngữ khác
     * @param {Object} post - Bài blog gốc
     * @param {string} targetLang - Ngôn ngữ đích
     * @param {string} sourceLang - Ngôn ngữ nguồn
     * @returns {Promise<Object>} Translation object cho ngôn ngữ đích
     */
    async translatePost(post, targetLang, sourceLang) {
        const sourceTranslation = post.translations[sourceLang];
        
        if (!sourceTranslation) {
            throw new Error(`Source language ${sourceLang} not found in post`);
        }
        
        console.log(`Starting translation from ${sourceLang} to ${targetLang}...`);
        
        // Dịch title
        console.log('Translating title...');
        const title = await this.translate(sourceTranslation.title, targetLang, sourceLang);
        
        // Dịch excerpt
        console.log('Translating excerpt...');
        const excerpt = await this.translate(sourceTranslation.excerpt || '', targetLang, sourceLang);
        
        // Dịch content (markdown)
        console.log('Translating content...');
        const content = await this.translateMarkdown(sourceTranslation.content, targetLang, sourceLang);
        
        console.log(`Translation to ${targetLang} completed!`);
        
        return {
            title,
            excerpt,
            content
        };
    },
    
    /**
     * Dịch nội dung Markdown (xử lý đặc biệt để giữ format)
     * @param {string} markdown - Nội dung markdown
     * @param {string} targetLang - Ngôn ngữ đích
     * @param {string} sourceLang - Ngôn ngữ nguồn
     * @returns {Promise<string>} Markdown đã dịch
     */
    async translateMarkdown(markdown, targetLang, sourceLang) {
        // Tách các phần văn bản và giữ lại các ký hiệu markdown
        const lines = markdown.split('\n');
        const translatedLines = [];
        
        for (let line of lines) {
            // Bỏ qua dòng trống
            if (line.trim().length === 0) {
                translatedLines.push(line);
                continue;
            }
            
            // Xử lý heading
            if (line.match(/^#+\s/)) {
                const match = line.match(/^(#+\s)(.+)$/);
                if (match) {
                    const heading = match[1];
                    const text = match[2];
                    const translated = await this.translate(text, targetLang, sourceLang);
                    translatedLines.push(heading + translated);
                } else {
                    translatedLines.push(line);
                }
                continue;
            }
            
            // Xử lý list items
            if (line.match(/^[\*\-\+]\s/) || line.match(/^\d+\.\s/)) {
                const match = line.match(/^([\*\-\+]\s|\d+\.\s)(.+)$/);
                if (match) {
                    const bullet = match[1];
                    const text = match[2];
                    const translated = await this.translate(text, targetLang, sourceLang);
                    translatedLines.push(bullet + translated);
                } else {
                    translatedLines.push(line);
                }
                continue;
            }
            
            // Dịch văn bản thông thường
            const translated = await this.translate(line, targetLang, sourceLang);
            translatedLines.push(translated);
        }
        
        return translatedLines.join('\n');
    },
    
    /**
     * Chia văn bản thành các phần nhỏ
     * @param {string} text - Văn bản cần chia
     * @param {number} maxLength - Độ dài tối đa mỗi phần
     * @returns {Array<string>} Mảng các phần văn bản
     */
    splitText(text, maxLength) {
        if (text.length <= maxLength) {
            return [text];
        }
        
        const chunks = [];
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let currentChunk = '';
        
        for (let sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    },
    
    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
