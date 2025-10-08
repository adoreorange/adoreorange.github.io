let talkTimer = null;

const cacheKey = 'talksCache';
const cacheTimeKey = 'talksCacheTime';
const cacheDuration = 30 * 60 * 1000; // 缓存有效期 30分钟

function indexTalk() {
    if (talkTimer) {
        clearInterval(talkTimer);
        talkTimer = null;
    }

    if (!document.getElementById('bber-talk')) return;

    function toText(ls) {
        let text = [];
        ls.forEach(item => {
            text.push(item.content.replace(/#(.*?)\s/g, '').replace(/\{(.*?)\}/g, '').replace(/\!\[(.*?)\]\((.*?)\)/g, '<i class="fa-solid fa-image"></i>').replace(/\[(.*?)\]\((.*?)\)/g, '<i class="fa-solid fa-link"></i>'));
        });
        return text;
    }

    function talk(ls) {
        let html = '';
        ls.forEach((item, i) => { html += `<li class="item item-${i + 1}">${item}</li>` });
        let box = document.querySelector("#bber-talk .talk-list");
        box.innerHTML = html;
        talkTimer = setInterval(() => {
            box.appendChild(box.children[0]);
        }, 3000);
    }

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const currentTime = new Date().getTime();

    // 判断缓存是否有效
    if (cachedData && cachedTime && (currentTime - cachedTime < cacheDuration)) {
        const data = toText(JSON.parse(cachedData));
        talk(data.slice(0, 6)); // 使用缓存渲染数据
    } else {
        fetch('https://ufqxjrndslio.us-east-1.clawcloudrun.com/api/memo/list', {  // 使用新的API地址
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: 30 })  // 限制30条数据
        })
        .then(res => res.json())
        .then(data => {
            // 确保新的API返回数据格式正确
            if (data.code === 0 && data.data && Array.isArray(data.data.list)) {
                localStorage.setItem(cacheKey, JSON.stringify(data.data.list));
                localStorage.setItem(cacheTimeKey, currentTime.toString());
                
                const formattedData = toText(data.data.list);  // 处理数据格式
                talk(formattedData.slice(0, 6));  // 渲染数据
            }
        })
        .catch(error => console.error('Error fetching data:', error));
    }
}

// pjax注释掉上面的 indexTalk(); 使用如下方法：
function whenDOMReady() {
    indexTalk();
}

whenDOMReady();
document.addEventListener("pjax:complete", whenDOMReady);
