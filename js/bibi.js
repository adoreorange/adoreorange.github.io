function renderTalks() {
    const e = document.querySelector("#talk");
    if (!e)
        return;
    e.innerHTML = "";
    const t = e => {
        function n(e, t) {
            var n = window.getComputedStyle(t);
            return parseFloat(n["margin" + e]) || 0
        }
        function a(e) {
            return e + "px"
        }
        function i(e) {
            return parseFloat(e.style.left)
        }
        function r(e) {
            return e.clientWidth
        }
        function s(e) {
            return function(e) {
                return parseFloat(e.style.top)
            }(e) + function(e) {
                return e.clientHeight
            }(e) + n("Bottom", e)
        }
        function l(e) {
            return i(e) + r(e) + n("Right", e)
        }
        function o(e) {
            e = e.sort((function(e, t) {
                return s(e) === s(t) ? i(t) - i(e) : s(t) - s(e)
            }
            ))
        }
        function c(n) {
            r(e) != h && (n.target.removeEventListener(n.type, arguments.callee),
            t(e))
        }
        "string" == typeof e && (e = document.querySelector(e));
        var d = [].map.call(e.children, (function(e) {
            return e.style.position = "absolute",
            e
        }
        ));
        e.style.position = "relative";
        var p = [];
        d.length && (d[0].style.top = "0px",
        d[0].style.left = a(n("Left", d[0])),
        p.push(d[0]));
        for (var u = 1; u < d.length; u++) {
            var m = d[u - 1]
              , g = d[u];
            if (!(l(m) + r(g) <= r(e)))
                break;
            g.style.top = m.style.top,
            g.style.left = a(l(m) + n("Left", g)),
            p.push(g)
        }
        for (; u < d.length; u++) {
            o(p);
            g = d[u];
            var v = p.pop();
            g.style.top = a(s(v) + n("Top", g)),
            g.style.left = a(i(v)),
            p.push(g)
        }
        o(p);
        var f = p[0];
        e.style.height = a(s(f) + n("Bottom", f));
        var h = r(e);
        window.addEventListener ? window.addEventListener("resize", c) : document.body.onresize = c
    }
      , n = e => {
        let t = r(new Date(e.createdAt).toString())
          , n = e.content
          , a = e.imgs ? e.imgs.split(",") : [];
        if (n = n.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="nofollow noopener">@$1</a>').replace(/- \[ \]/g, "⚪").replace(/- \[x\]/g, "⚫"),
        n = n.replace(/\n/g, "<br>"),
        n = `<div class="talk_content_text">${n}</div>`,
        a.length > 0) {
            const e = document.createElement("div");
            e.className = "zone_imgbox",
            a.forEach((t => {
                const n = document.createElement("a");
                n.href = t + "?fmt=webp&q=75",
                n.setAttribute("data-fancybox", "gallery"),
                n.className = "fancybox",
                n.setAttribute("data-thumb", t);
                const a = document.createElement("img");
                a.src = t + "?fmt=webp&q=75",
                n.appendChild(a),
                e.appendChild(n)
            }
            )),
            n += e.outerHTML
        }
        if (e.externalUrl) {
            const t = e.externalUrl
              , a = e.externalTitle;
            n += `\n            <div class="shuoshuo-external-link">\n                <a class="external-link" href="${t}" target="_blank" rel="nofollow noopener">\n                    <div class="external-link-left" style="background-image: url(${e.externalFavicon})"></div>\n                    <div class="external-link-right">\n                        <div class="external-link-title">${a}</div>\n                        <div>点击跳转<i class="fa-solid fa-angle-right"></i></div>\n                    </div>\n                </a>\n            </div>`
        }
        const i = JSON.parse(e.ext || "{}");
        if (i.music && i.music.id) {
            const e = i.music;
            e.api.replace(":server", e.server).replace(":type", e.type).replace(":id", e.id);
            n += `\n            <meting-js server="${e.server}" type="${e.type}" id="${e.id}" api="${e.api}"></meting-js>\n        `
        }
        if (i.doubanMovie && i.doubanMovie.id) {
            const e = i.doubanMovie
              , t = e.url
              , a = e.title
              , r = e.image;
            n += `\n                <a class="douban-card" href="${t}" target="_blank"  rel="nofollow noopener">\n                    <div class="douban-card-bgimg" style="background-image: url('${r}');"></div>\n                    <div class="douban-card-left">\n                        <div class="douban-card-img" style="background-image: url('${r}');"></div>\n                    </div>\n                    <div class="douban-card-right">\n                        <div class="douban-card-item"><span>电影名: </span><strong>${a}</strong></div>\n                        <div class="douban-card-item"><span>导演: </span><span>${e.director || "未知导演"}</span></div>\n                        <div class="douban-card-item"><span>评分: </span><span>${e.rating || "暂无评分"}</span></div>\n                        <div class="douban-card-item"><span>时长: </span><span>${e.runtime || "未知时长"}</span></div>\n                    </div>\n                </a>\n            `
        }
        if (i.doubanBook && i.doubanBook.id) {
            const e = i.doubanBook
              , t = e.url
              , a = e.title
              , r = e.image
              , s = e.author
              , l = e.rating;
            n += `\n                <a class="douban-card" href="${t}" target="_blank"  rel="nofollow noopener">\n                    <div class="douban-card-bgimg" style="background-image: url('${r}');"></div>\n                        <div class="douban-card-left">\n                            <div class="douban-card-img" style="background-image: url('${r}');"></div>\n                        </div>\n                        <div class="douban-card-right">\n                            <div class="douban-card-item">\n                                <span>书名: </span><strong>${a}</strong>\n                            </div>\n                            <div class="douban-card-item">\n                                <span>作者: </span><span>${s}</span>\n                            </div>\n                            <div class="douban-card-item">\n                                <span>出版年份: </span><span>${e.pubDate}</span>\n                            </div>\n                            <div class="douban-card-item">\n                                <span>评分: </span><span>${l}</span>\n                            </div>\n                        </div>\n                </a>\n            `
        }
        if (i.video && i.video.type) {
            const e = i.video.type
              , t = i.video.value;
            if ("bilibili" === e) {
                n += `\n                <div style="position: relative; padding: 30% 45%; margin-top: 10px;">\n                    <iframe \n                        style="position: absolute; width: 100%; height: 100%; left: 0; top: 0; border-radius: 12px;" \n                        src="${t.replace("player.bilibili.com/player.html", "www.bilibili.com/blackboard/html5mobileplayer.html")}&as_wide=1&high_quality=1&danmaku=0"\n                        scrolling="no" \n                        border="0"\n                        frameborder="no" \n                        framespacing="0"\n                        allowfullscreen="true"\n                        loading="lazy"\n                    >\n                    </iframe>\n                </div>\n            `
            } else if ("youtube" === e) {
                n += `\n                <div style="position: relative; padding: 30% 45%; margin-top: 10px;">\n                    <iframe width="100%"\n                        style="position: absolute; width: 100%; height: 100%; left: 0; top: 0; border-radius: 12px;"\n                        src="${t}"\n                        title="YouTube video player" \n                        frameborder="0" \n                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" \n                        referrerpolicy="strict-origin-when-cross-origin" \n                        allowfullscreen>\n                    </iframe>\n                </div>\n            `
            }
        }
        return {
            content: n,
            user: e.user.nickname || "匿名",
            avatar: e.user.avatarUrl || "https://source.adoreorg.cn/webp/icon/4351755864678_.pic.jpg",
            date: t,
            location: e.location || "上海市",
            tags: e.tags ? e.tags.split(",").filter((e => "" !== e.trim())) : ["无标签"],
            text: n.replace(/\[(.*?)\]\((.*?)\)/g, "[链接]" + (a.length ? "[图片]" : ""))
        }
    }
      , a = e => {
        const t = document.createElement("div");
        t.className = "talk_item";
        const n = document.createElement("div");
        n.className = "talk_meta";
        const a = document.createElement("img");
        a.className = "no-lightbox avatar",
        a.src = e.avatar;
        const r = document.createElement("div");
        r.className = "info";
        const s = document.createElement("span");
        s.className = "talk_nick",
        s.innerHTML = `${e.user} <svg viewBox="0 0 512 512"xmlns="http://www.w3.org/2000/svg"class="is-badge icon"><path d="m512 268c0 17.9-4.3 34.5-12.9 49.7s-20.1 27.1-34.6 35.4c.4 2.7.6 6.9.6 12.6 0 27.1-9.1 50.1-27.1 69.1-18.1 19.1-39.9 28.6-65.4 28.6-11.4 0-22.3-2.1-32.6-6.3-8 16.4-19.5 29.6-34.6 39.7-15 10.2-31.5 15.2-49.4 15.2-18.3 0-34.9-4.9-49.7-14.9-14.9-9.9-26.3-23.2-34.3-40-10.3 4.2-21.1 6.3-32.6 6.3-25.5 0-47.4-9.5-65.7-28.6-18.3-19-27.4-42.1-27.4-69.1 0-3 .4-7.2 1.1-12.6-14.5-8.4-26-20.2-34.6-35.4-8.5-15.2-12.8-31.8-12.8-49.7 0-19 4.8-36.5 14.3-52.3s22.3-27.5 38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3 0-27 9.1-50.1 27.4-69.1s40.2-28.6 65.7-28.6c11.4 0 22.3 2.1 32.6 6.3 8-16.4 19.5-29.6 34.6-39.7 15-10.1 31.5-15.2 49.4-15.2s34.4 5.1 49.4 15.1c15 10.1 26.6 23.3 34.6 39.7 10.3-4.2 21.1-6.3 32.6-6.3 25.5 0 47.3 9.5 65.4 28.6s27.1 42.1 27.1 69.1c0 12.6-1.9 24-5.7 34.3 16 7.6 28.8 19.3 38.3 35.1 9.5 15.9 14.3 33.4 14.3 52.4zm-266.9 77.1 105.7-158.3c2.7-4.2 3.5-8.8 2.6-13.7-1-4.9-3.5-8.8-7.7-11.4-4.2-2.7-8.8-3.6-13.7-2.9-5 .8-9 3.2-12 7.4l-93.1 140-42.9-42.8c-3.8-3.8-8.2-5.6-13.1-5.4-5 .2-9.3 2-13.1 5.4-3.4 3.4-5.1 7.7-5.1 12.9 0 5.1 1.7 9.4 5.1 12.9l58.9 58.9 2.9 2.3c3.4 2.3 6.9 3.4 10.3 3.4 6.7-.1 11.8-2.9 15.2-8.7z"fill="#1da1f2"></path></svg>`;
        const l = document.createElement("span");
        l.className = "talk_date",
        l.textContent = e.date;
        const o = document.createElement("div");
        o.className = "talk_content",
        o.innerHTML = e.content;
        const c = document.createElement("div");
        c.className = "talk_bottom";
        const d = document.createElement("div")
          , p = document.createElement("span");
        p.className = "talk_tag",
        p.textContent = `🏷️${e.tags}`;
        const u = document.createElement("span");
        u.className = "location_tag",
        u.textContent = `🌍${e.location}`,
        d.appendChild(p),
        d.appendChild(u);
        const m = document.createElement("a");
        m.href = "javascript:;",
        m.onclick = () => i(e.text);
        const g = document.createElement("span");
        g.className = "icon";
        const v = document.createElement("i");
        return v.className = "fa-solid fa-message fa-fw",
        g.appendChild(v),
        m.appendChild(g),
        n.appendChild(a),
        r.appendChild(s),
        r.appendChild(l),
        n.appendChild(r),
        t.appendChild(n),
        t.appendChild(o),
        c.appendChild(d),
        c.appendChild(m),
        t.appendChild(c),
        t
    }
      , i = e => {
        const t = e.match(/<div class="talk_content_text">([\s\S]*?)<\/div>/)
          , n = t ? t[1] : ""
          , a = document.querySelector(".el-textarea__inner");
        a.value = `> ${n}\n\n`,
        a.focus(),
        btf.snackbarShow("已为您引用该说说，不删除空格效果更佳")
    }
      , r = e => {
        const t = new Date(e)
          , n = [t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()].map((e => 1 === e.toString().length ? "0" + e : e));
        return `${n[0]}-${n[1]}-${n[2]} ${n[3]}:${n[4]}`
    }
    ;
    ( () => {
        const i = "talksCache"
          , r = "talksCacheTime"
          , s = localStorage.getItem(i)
          , l = localStorage.getItem(r)
          , o = (new Date).getTime();
        if (s && l && o - l < 18e5) {
            c(JSON.parse(s))
        } else
            e && (e.innerHTML = "",
            fetch("https://ufqxjrndslio.us-east-1.clawcloudrun.com/api/memo/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    size: 30
                })
            }).then((e => e.json())).then((e => {
                0 === e.code && e.data && Array.isArray(e.data.list) && (localStorage.setItem(i, JSON.stringify(e.data.list)),
                localStorage.setItem(r, o.toString()),
                c(e.data.list))
            }
            )).catch((e => {
                console.error("Error fetching data:", e)
            }
            )));
        function c(i) {
            if (Array.isArray(i)) {
                i.map((e => n(e))).forEach((t => e.appendChild(a(t)))),
                t("#talk")
            } else
                console.error("Data is not an array:", i)
        }
    }
    )()
}
renderTalks();
