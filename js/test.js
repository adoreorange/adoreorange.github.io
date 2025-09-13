document.addEventListener("DOMContentLoaded", (function() {
    const e = {
        formatDateTime: e => {
            const t = new Date(e);
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`
        }
        ,
        umiToken: "fM7+vUSp/wpEp/mp0LxXrjS46tMQWimFhssZdUuj2SADnmGfHo5rZMOh4PpYSumeLcUNt4a2+q0TNW6VH5vymKH3YFxPNxOm28yjdAAHD/Tew66V/8Ad/K9dXxULUuMWaSL2hUS2zTGIZWipOYUHzkjRFwShDAYQwfbgOGrmgW/P36qqr9FaZaKt9LYVkbY9hQKQ4tRTlhc8zFgwIn/q3Rw/ot7G0HVprAk3PwBkEdyDfPQd7kchi/f+g1g+1X856/v0O7GirvBeQQ7TPhi4/H0/kNm+ZABPDk6+VomlMNnYdZi1KiW90SfTOcUDlvObyKUbCsQpl/LMiDeAtby+0pzkqaSLSpsr7Y5eoR4pDP4Wt+RaZkkHjawJfYjc",
        fetchUmami: async (e, t, n) => {
            try {
                if (!e || !t || !n)
                    throw new Error("参数 startAt、endAt 或 umiToken 不完整");
                const a = new URL("https://umami.aimiliy.top/api/websites/3348d0ad-813b-4d17-98d2-d5404445f786/stats");
                a.searchParams.append("startAt", e.getTime()),
                a.searchParams.append("endAt", t.getTime());
                const o = await fetch(a.toString(), {
                    method: "GET",
                    cache: "default",
                    headers: {
                        Authorization: `Bearer ${n}`,
                        "Content-Type": "application/json"
                    }
                });
                if (!o.ok)
                    throw new Error(`请求失败，状态码：${o.status} ${o.statusText}`);
                return await o.json()
            } catch (e) {
                throw console.error("获取 umami 统计数据失败：", e.message),
                e
            }
        }}
    , l = {
        init: async () => {
            await (async () => {
                const t = document.querySelector("#statisticW .content");
                if (!t)
                    return;
                const n = new Date
                  , a = new Date(n.setHours(0, 0, 0, 0))
                  , o = new Date(n.getFullYear(),n.getMonth(),n.getDate() - 1)
                  , s = new Date(n.getFullYear(),n.getMonth(),n.getDate() - 1,23,59,59,999)
                  , r = new Date(n.getFullYear(),n.getMonth(),1);
                try {
                    const [n,i,l] = await Promise.all([e.fetchUmami(o, s, e.umiToken), e.fetchUmami(a, new Date, e.umiToken), e.fetchUmami(r, new Date, e.umiToken)])
                      , c = ["今日人数", "昨日人数", "今日访问", "昨日访问", "本月访问"]
                      , d = [i.visitors?.value || 0, n.visitors?.value || 0, i.pageviews?.value || 0, n.pageviews?.value || 0, l.pageviews?.value || 0]
                      , u = () => {
                        c.forEach(( (e, t) => {
                            const n = document.getElementById(e)
                              , a = parseFloat(n.textContent.replace(/,/g, "")) || 0;
                            new CountUp(n,a,d[t],0,2,{
                                useEasing: !0,
                                useGrouping: !0,
                                separator: ",",
                                decimal: "."
                            }).start()
                        }
                        ))
                    }
                    ;
                    new IntersectionObserver(( (e, t) => {
                        e.forEach((e => {
                            e.isIntersecting && ("function" == typeof CountUp ? u() : getScript(`${GLOBAL_CONFIG.countUp.js}`).then(u),
                            t.disconnect())
                        }
                        ))
                    }
                    )).observe(t)
                } catch (e) {
                    console.warn("统计数据加载失败", e)
                }
            }
            )()
        }
    };
    p(),
    btf.addGlobalFn("pjaxComplete", p)
}
));
