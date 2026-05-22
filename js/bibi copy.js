// 与路径 "/personal/bb/" 相关的所有函数
// 提取自 bibi.js 文件，专注于说说/动态展示功能

document.addEventListener("DOMContentLoaded", (function() {
    const e = {
        formatDateTime: e => {
            const t = new Date(e);
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`
        },
        removeAllHtmlTags: e => `“${e.replace(/<[^>]+>.*?<\/[^>]+>|<[^>]+\/>|<[^>]+>/gis, "").trim()}”`,
        removeAllHtmlTagsNoMark: e => `${e.replace(/<[^>]+>.*?<\/[^>]+>|<[^>]+\/>|<[^>]+>/gis, "").trim()}`,
        contentFormat: e => {
            let t = "<br>";
            const n = [...e.matchAll(/<video.*?src=["'](.*?)["'].*?>.*?<\/video>/gi)];
            n.length > 0 && n.forEach((n => {
                const a = n[1];
                let o = "";
                if (a.includes("bilibili.com/video/")) {
                    const e = a.match(/\/video\/(BV\w+)/);
                    e && (o = `\n                              <div style="position: relative; padding: 30% 45%; margin-top: 10px;">\n                                <div class="iframe-loader" data-src="https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${e[1]}&as_wide=1&high_quality=1&danmaku=0">\n                                  <div class="loading-spinner glow"></div>\n                                </div>\n                              </div>`)
                } else
                    o = `\n                          <a class="bber-content-video" href="${a}" data-fancybox="gallery" data-caption="">\n                            <video src="${a}" controls style="max-width: 100%; border-radius: 10px; margin-top: 10px;"></video>\n                          </a>`;
                t += o,
                e = e.replace(n[0], "")
            }
            ));
            let a = e.match(/(http(.*).[jpg|png|gif])/g);
            return e = (e = e.replace(/<img(.*?)src=[\"|\\']?(.*?)[\"|\\']?(.*?)>|!\[(.*?)\]\((.*?)\)/g, "")).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""),
            a && a.forEach((e => {
                t += '<a href="' + e + '" target="_blank" data-fancybox="group" class="fancybox"><img src="' + e + '" style="max-width: 100%; object-fit: cover; border-radius: 10px;margin-top: 10px"></a>'
            }
            )),
            (e += t).replace(/(<br\s*\/?>)+$/, "")
        }
    };

    // 与 /personal/bb/ 路径相关的主要模块
    const i = {
        init: () => {
            let t = 0
              , n = 0
              , a = []
              , o = 1;
            const s = document.getElementById("more")
              , r = document.getElementById("bb_loading");
            let i = document.getElementById("bb-main");           
            const l = new Masonry(i,{
                itemSelector: ".bb-card",
                columnWidth: ".bb-card",
                gutter: 10,
                percentPosition: !0
            });
            let c = !1;
            const d = async () => {
                if (!c) {
                    c = !0,
                    s && (s.style.display = "none"),
                    r && (r.style.display = "block");
                    try {
                        const e = await fetch('https://mm.liushen.fun/api/memo/list', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                page: o,
                                size: 12
                            })
                        });
                        if (!e.ok)
                            throw new Error("网络错误: " + e.status);
                        const s = await e.json();
                        t = s.data.total,
                        a = s.data.items,
                        n += a.length,
                        1 === o && (document.querySelector(".bb-info").innerHTML = `\n                                <svg style="width:1.20em;height:1.20em;top:5px;fill:currentColor;overflow:hidden;position:relative">\n                                    <use xlink:href="#icon-chat"></use>\n                                </svg> 站长的日常分享(${t})\n                            `),
                        o += 1,
                        await u()
                    } catch (e) {
                        console.error("获取数据失败:", e);
                        // 修复：替换 btf.$notify 为标准的 alert 或 console.error
                        if (typeof btf !== 'undefined' && btf.$notify) {
                            btf.$notify("加载失败", "当前网络异常，请稍后重试", "error", 3e3);
                        } else {
                            alert("加载失败：当前网络异常，请稍后重试");
                        }
                    } finally {
                        r && (r.style.display = "none"),
                        n < t && s && (s.style.display = "block"),
                        c = !1
                    }
                }
            }
              , u = () => new Promise((o => {
                let c = 0;
                setTimeout(( () => {
                    r && (r.style.display = "none")
                }
                ), 300);
                const d = () => {
                    if (c >= a.length)
                        return n < t && s && (s.style.display = "block"),
                        void o();
                    const r = a[c]
                      , u = e.formatDateTime(r.createdAt);
                    r.content = e.contentFormat(r.content);
                    const m = e.removeAllHtmlTags(r.content)
                      , p = document.createElement("div");
                    p.className = "bb-card",
                    p.style.opacity = "0",
                    p.style.transform = "translateY(20px)",
                    p.innerHTML = `\n                                    <div class="card-header">\n                                        <div class="avatar">\n                                            <img class="nofancybox" src="${r.author.avatar}">\n                                        </div>\n                                        <div class="bb-info-avatar">\n                                            <span><div class="name">${r.author.nickName}</div><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="is-badge"><path  d="m512 268c0 17.9-4.3 34.5-12.9 49.7s-20.1 27.1-34.6 35.4c.4 2.7.6 6.9.6 12.6 0 27.1-9.1 50.1-27.1 69.1-18.1 19.1-39.9 28.6-65.4 28.6-11.4 0-22.3-2.1-32.6-6.3-8 16.4-19.5 29.6-34.6 39.7-15 10.2-31.5 15.2-49.4 15.2-18.3 0-34.9-4.9-49.7-14.9-14.9-9.9-26.3-23.2-34.3-40-10.3 4.2-21.1 6.3-32.6 6.3-25.5 0-47.4-9.5-65.7-28.6-18.3-19-27.4-42.1-27.4-69.1c0-3 .4-7.2 1.1-12.6-14.5-8.4-26-20.2-34.6-35.4-8.5-15.2-12.8-31.8-12.8-49.7 0-19 4.8-36.5 14.3-52.3s22.3-27.5 38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3 0-27 9.1-50.1 27.4-69.1s40.2-28.6 65.7-28.6c11.4 0 22.3 2.1 32.6 6.3 8-16.4 19.5-29.6 34.6-39.7 15-10.1 31.5-15.2 49.4-15.2s34.4 5.1 49.4 15.1c15 10.1 26.6 23.3 34.6 39.7 10.3-4.2 21.1-6.3 32.6-6.3 25.5 0 47.3 9.5 65.4 28.6s27.1 42.1 27.1 69.1c0 12.6-1.9 24-5.7 34.3 16 7.6 28.8 19.3 38.3 35.1 9.5 15.9 14.3 33.4 14.3 52.4zm-266.9 77.1 105.7-158.3c2.7-4.2 3.5-8.8 2.6-13.7-1-4.9-3.5-8.8-7.7-11.4-4.2-2.7-8.8-3.6-13.7-2.9-5 .8-9 3.2-12 7.4l-93.1 140-42.9-42.8c-3.8-3.8-8.2-5.6-13.1-5.4-5 .2-9.3 2-13.1 5.4-3.4 3.4-5.1 7.7-5.1 12.9 0 5.1 1.7 9.4 5.1 12.9l58.9 58.9 2.9 2.3c3.4 2.3 6.9 3.4 10.3 3.4 6.7-.1 11.8-2.9 15.2-8.7z" fill="#1da1f2"></path></svg></span>\n                                            <div class="card-time">${u}</div>\n                                        </div>\n                                    </div>\n                                    <div class="card-content">${r.content}</div>\n                                    <div class="card-footer">\n                                        <div class="card-label" style="background: ${r.tag.bgColor}; color: white;">\n                                            ${r.tag.name}\n                                        </div>\n                                        <div class="bb-fos" onclick="navigator.clipboard.writeText('${m}').then(() => { alert('已复制到剪贴板'); }).catch(() => { alert('复制失败，请手动复制'); })">\n                                            <svg style="width:1.60em;height:1.60em;fill:var(--theme-color);overflow:hidden;cursor: pointer;">\n                                                <use xlink:href="#icon-xiaoxi"></use>\n                                            </svg>\n                                        </div>\n                                    </div>\n                                `,
                    i.appendChild(p),
                    imagesLoaded(p, ( () => {
                        l.appended(p),
                        l.layout(),
                        p.style.transition = "opacity 0.4s ease, transform 0.4s ease",
                        p.style.opacity = "1",
                        p.style.transform = "translateY(0)",
                        // 修复：替换 btf.runIdle 为 setTimeout
                        setTimeout(( () => {
                            p.querySelectorAll(".iframe-loader[data-src]").forEach((e => {
                                if (e.dataset.loaded)
                                    return;
                                const t = e.getAttribute("data-src")
                                  , n = document.createElement("iframe");
                                n.src = t,
                                n.loading = "lazy",
                                n.scrolling = "no",
                                n.frameBorder = "0",
                                n.framespacing = "0",
                                n.allowFullscreen = !0,
                                n.style.cssText = "position: absolute; width: 100%; height: 100%; top: 0; left: 0; border-radius: 10px; opacity: 0; transition: opacity 0.3s ease;",
                                e.appendChild(n),
                                setTimeout(( () => {
                                    n.src = t
                                }
                                ), 0),
                                n.onload = () => {
                                    setTimeout(( () => {
                                        const t = e.querySelector(".loading-spinner");
                                        t && t.remove(),
                                        n.style.opacity = "1",
                                        e.dataset.loaded = "true"
                                    }
                                    ), 50)
                                }
                            }
                            ))
                        }
                        ), 1e3),
                        c++,
                        setTimeout(d, 100)
                    }
                    ))
                }
                ;
                d()
            }
            ));
            d(),   
            // 修复：替换 btf.addGlobalFn 为标准的 DOM 事件监听
            document.addEventListener('pjax:complete', () => {
                if (l) {
                    l.destroy();
                }
            });
            
            // 修复：替换 btf.addEventListenerPjax 为标准的 DOM 事件监听
            if (s) {
                s.addEventListener('click', d);
            } else {
                console.warn("more 按钮未找到，无限滚动功能将不可用");
            }
        }
    };

    // 路径配置
    const u = [{
        path: "/personal/bb/",
        modules: [i]
    }];

    // 页面初始化
    const p = () => {
        const e = window.location.pathname;
        for (const t of u)
            if (e === t.path) {
                t.modules.forEach((e => e.init?.()));
                break
            }
    };
    p();
    // 修复：替换 btf.addGlobalFn 为标准的 DOM 事件监听
    document.addEventListener('pjax:complete', p);
}));