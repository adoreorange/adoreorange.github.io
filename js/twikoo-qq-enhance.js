// Twikoo QQ头像增强配置
(function() {
    'use strict';
    
    // 等待Twikoo加载完成
    function enhanceTwikooAvatar() {
        const checkTwikoo = setInterval(() => {
            if (window.twikoo) {
                clearInterval(checkTwikoo);
                initTwikooEnhancement();
            }
        }, 500);
    }

    function initTwikooEnhancement() {
        // 监听Twikoo评论框加载
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    enhanceTwikooForm();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        enhanceTwikooForm();
    }

    // 增强Twikoo评论表单
    function enhanceTwikooForm() {
        const emailInput = document.querySelector('.tk-input[data-name="mail"] input, input[name="mail"]');
        if (emailInput && !emailInput.dataset.twikooEnhanced) {
            emailInput.dataset.twikooEnhanced = 'true';
            
            // 添加QQ邮箱提示
            const formContainer = emailInput.closest('.tk-comments') || emailInput.closest('.twikoo');
            if (formContainer) {
                const qqHint = document.createElement('div');
                qqHint.className = 'twikoo-qq-hint';
                qqHint.innerHTML = '<small style="color: #666; margin-top: 5px; display: block;">💡 输入QQ邮箱(如123456@qq.com)可显示QQ头像</small>';
                
                // 找到合适的位置插入提示
                const insertAfter = emailInput.parentNode.parentNode || emailInput.parentNode;
                if (insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(qqHint, insertAfter.nextSibling);
                } else {
                    insertAfter.parentNode.appendChild(qqHint);
                }
            }

            // 监听邮箱输入变化
            emailInput.addEventListener('input', function() {
                const email = this.value.trim();
                if (email.match(/^[1-9][0-9]{4,}@qq\.com$/i)) {
                    // 提取QQ号码
                    const qqNumber = email.split('@')[0];
                    updateAvatarPreview(qqNumber);
                }
            });
        }
    }

    // 更新头像预览
    function updateAvatarPreview(qqNumber) {
        // 找到头像预览元素
        const avatarElements = document.querySelectorAll('.tk-avatar img, .tk-avatar .tk-avatar-img');
        avatarElements.forEach(img => {
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
            }
            img.src = `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
        });
    }

    // 配置Twikoo头像处理
    function configureTwikooAvatar() {
        // 重写头像获取逻辑
        if (window.twikoo) {
            const originalGetAvatar = window.twikoo.getAvatar || function() {};
            
            window.twikoo.getAvatar = function(mail, avatarConfig) {
                // 检查是否为QQ邮箱
                if (mail && mail.match(/^[1-9][0-9]{4,}@qq\.com$/i)) {
                    const qqNumber = mail.split('@')[0];
                    return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`;
                }
                
                // 使用原始逻辑
                return originalGetAvatar.call(this, mail, avatarConfig);
            };
        }
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            enhanceTwikooAvatar();
            configureTwikooAvatar();
        });
    } else {
        enhanceTwikooAvatar();
        configureTwikooAvatar();
    }

    // 兼容pjax
    document.addEventListener('pjax:complete', function() {
        enhanceTwikooAvatar();
        configureTwikooAvatar();
    });

    // 监听路由变化
    window.addEventListener('hashchange', function() {
        enhanceTwikooAvatar();
    });
})();