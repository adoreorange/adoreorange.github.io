var music = [
    {id: "3783043919", type: "playlist", server: "tencent"}, //对应metingJs的配置字段
    {id: "8175136018", type: "playlist", server: "tencent"},
    {id: "8230910922", type: "playlist", server: "tencent"},
    {id: "7395068894", type: "playlist", server: "tencent"},
    {id: "8823061377", type: "playlist", server: "tencent"}
];

const defaultMusic = {id: "8823061377", type: "playlist", server: "tencent"}; // 默认歌单
let localMusic = JSON.parse(localStorage.getItem("localMusic")) || defaultMusic;  // 当前正在播放的歌单

if (!localStorage.getItem("defaultMusic")) {
    localStorage.setItem("defaultMusic", JSON.stringify(defaultMusic));
}

if (!localStorage.getItem("localMusic")) {
    localStorage.setItem("localMusic", JSON.stringify(localMusic));
}

let musicVolume = 0.8;  // 初始音量
const adoreorg = {
    // 音乐节目切换背景
    changeMusicBg: function (isChangeBg = true) {
        if (window.location.pathname != "/life/music/") {
            return;
        }
        const anMusicBg = document.getElementById("an_music_bg");

        if (isChangeBg) {
            const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
            anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
        } else {
            // 第一次进入，绑定事件，改背景
            let timer = setInterval(() => {
                const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
                // 确保player加载完成
                if (musiccover) {
                    clearInterval(timer);
                    anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
                    // 绑定事件
                    adoreorg.addEventListenerMusic();
                    // 确保第一次能够正确替换背景
                    adoreorg.changeMusicBg();
                }
            }, 100);
        }
    },
    addEventListenerMusic: function () {
        const anMusicPage = document.getElementById("anMusic-page");
        const aplayerIconMenu = anMusicPage.querySelector(".aplayer-info .aplayer-time .aplayer-icon-menu");
        const anMusicBtnGetSong = anMusicPage.querySelector("#anMusicBtnGetSong");
        const anMusicRefreshBtn = anMusicPage.querySelector("#anMusicRefreshBtn");
        const anMusicSwitchingBtn = anMusicPage.querySelector("#anMusicSwitching");

        const metingAplayer = anMusicPage.querySelector("meting-js")?.aplayer || document.querySelector("meting-js")?.aplayer; // 获取Aplayer对象，需要根据插件使用情况调整
        //初始化音量
        metingAplayer.volume(0.8, true);
        metingAplayer.on("loadeddata", function () {  //loadedata时间，监听音乐是否切换，如果切换则修改对应背景
            adoreorg.changeMusicBg();
        });

        aplayerIconMenu.addEventListener("click", function () {
            document.getElementById("menu-mask").style.display = "block";
            document.getElementById("menu-mask").style.animation = "0.5s ease 0s 1 normal none running to_show";
            anMusicPage.querySelector(".aplayer.aplayer-withlist .aplayer-list").style.opacity = "1";
        });
        function anMusicPageMenuAask() {
            if (window.location.pathname != "/life/music/") {
                document.getElementById("menu-mask").removeEventListener("click", anMusicPageMenuAask);
                return;
            }
            anMusicPage.querySelector(".aplayer-list").classList.remove("aplayer-list-hide");
        }
        document.getElementById("menu-mask").addEventListener("click", anMusicPageMenuAask);
        // 监听增加单曲按钮
        anMusicBtnGetSong.addEventListener("click", () => {
            const anMusicPage = document.getElementById("anMusic-page");
            const metingAplayer = anMusicPage.querySelector("meting-js")?.aplayer || document.querySelector("meting-js")?.aplayer;
            if (!metingAplayer) {
                console.error("无法获取APlayer实例");
                return;
            }
            const allAudios = metingAplayer.list.audios;
            const randomIndex = Math.floor(Math.random() * allAudios.length);
            // 随机播放一首
            metingAplayer.list.switch(randomIndex);
        });
        anMusicRefreshBtn.addEventListener("click", () => {
            adoreorg.refreshMusicList();
        });
        anMusicSwitchingBtn.addEventListener("click", () => {
            adoreorg.changeMusicList();
        });
        // 监听键盘事件
        //空格控制音乐
        document.addEventListener("keydown", function (event) {
            const anMusicPage = document.getElementById("anMusic-page");
            const metingAplayer = anMusicPage.querySelector("meting-js")?.aplayer || document.querySelector("meting-js")?.aplayer;
            if (!metingAplayer) {
                console.error("无法获取APlayer实例");
                return;
            }
            //暂停开启音乐
            if (event.code === "Space") {
                event.preventDefault();
                metingAplayer.toggle();
            }
            //切换下一曲
            if (event.keyCode === 39) {
                event.preventDefault();
                metingAplayer.skipForward();
            }
            //切换上一曲
            if (event.keyCode === 37) {
                event.preventDefault();
                metingAplayer.skipBack();
            }
            //增加音量
            if (event.keyCode === 38) {
                if (musicVolume <= 1) {
                    musicVolume += 0.1;
                    metingAplayer.volume(musicVolume, true);
                }
            }
            //减小音量
            if (event.keyCode === 40) {
                if (musicVolume >= 0) {
                    musicVolume += -0.1;
                    metingAplayer.volume(musicVolume, true);
                }
            }
        });
    },
    refreshMusicList: async function () {
        const anMusicPage = document.getElementById("anMusic-page");
        const metingAplayer = anMusicPage?.querySelector("meting-js")?.aplayer || document.querySelector("meting-js")?.aplayer;
        
        if (!metingAplayer) {
            console.error("无法获取APlayer实例");
            return;
        }

        try {
            let songs = [];
            localMusic = defaultMusic;
            localStorage.setItem("localMusic", JSON.stringify(defaultMusic));
            
            const url = `https://api.i-meto.com/meting/api?server=${encodeURIComponent(localMusic.server)}&type=${encodeURIComponent(localMusic.type)}&id=${encodeURIComponent(localMusic.id)}&auth=undefined&r=${Date.now()}`;
            
            songs = await this.fetchSongsWithRetry(url);
            
            if (songs && songs.length > 0) {
                metingAplayer.list.clear();
                metingAplayer.list.add(songs);
                console.log(`🔄 刷新歌单成功: ${localMusic.id}, 共${songs.length}首歌`);
            } else {
                console.warn("⚠️ 刷新歌单失败: 获取到的歌曲列表为空");
            }
        } catch (error) {
            console.error("❌ 刷新歌单失败:", error);
        }
    },
    // 切换歌单
    changeMusicList: async function () {
        const anMusicPage = document.getElementById("anMusic-page");
        const metingAplayer = anMusicPage?.querySelector("meting-js")?.aplayer || document.querySelector("meting-js")?.aplayer;
        
        if (!metingAplayer) {
            console.error("无法获取APlayer实例");
            return;
        }

        // 验证音乐列表
        if (!music || !Array.isArray(music) || music.length === 0) {
            console.error("音乐列表为空或格式错误");
            return;
        }

        let songs = [];
        let currentMusicData;
        
        // 安全解析localStorage数据
        try {
            currentMusicData = JSON.parse(localStorage.getItem("localMusic")) || defaultMusic;
        } catch (e) {
            console.error("解析localStorage失败，使用默认数据", e);
            currentMusicData = defaultMusic;
        }

        // 智能随机选择，防止无限循环
        let randomMusic = Math.floor(Math.random() * music.length);
        
        if (music.length > 1) {
            let attempts = 0;
            const maxAttempts = Math.min(music.length * 2, 10);
            
            while (currentMusicData.id === music[randomMusic].id && attempts < maxAttempts) {
                randomMusic = Math.floor(Math.random() * music.length);
                attempts++;
            }
            
            // 如果尝试次数过多，强制选择下一个
            if (attempts >= maxAttempts) {
                const currentIndex = music.findIndex(m => m.id === currentMusicData.id);
                randomMusic = (currentIndex + 1) % music.length;
            }
        }

        localMusic = music[randomMusic];
        localStorage.setItem("localMusic", JSON.stringify(music[randomMusic]));
        
        try {
            const url = `https://api.i-meto.com/meting/api?server=${encodeURIComponent(music[randomMusic].server)}&type=${encodeURIComponent(music[randomMusic].type)}&id=${encodeURIComponent(music[randomMusic].id)}&auth=undefined&r=${Date.now()}`;
            
            songs = await this.fetchSongsWithRetry(url);
            
            if (songs && songs.length > 0) {
                metingAplayer.list.clear();
                metingAplayer.list.add(songs);
                console.log(`✅ 成功切换到歌单: ${music[randomMusic].id} (${music[randomMusic].server}), 共${songs.length}首歌`);
            } else {
                console.warn("⚠️ 获取到的歌曲列表为空");
            }
        } catch (error) {
            console.error("❌ 切换歌单失败:", error);
        }
    },
    // 获取歌曲列表（带超时和验证）
    async fetchSongs(url, timeout = 8000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 验证数据格式
            if (!Array.isArray(data)) {
                throw new Error("返回数据不是数组格式");
            }
            
            // 过滤有效歌曲
            const validSongs = data.filter(song => 
                song && 
                typeof song === 'object' && 
                (song.name || song.title) && 
                (song.artist || song.author || song.artists || song.creator)
            ).map(song => ({
                name: song.name || song.title,
                artist: song.artist || song.author || (song.artists && song.artists[0]) || song.creator,
                url: song.url || song.mp3,
                cover: song.cover || song.pic || song.album?.picUrl,
                lrc: song.lrc || song.lyric,
                ...song
            }));
            
            return validSongs;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.error("请求超时", error);
            } else {
                console.error("获取歌曲失败:", error.message);
            }
            
            return [];
        }
    },
    // 带重试机制的获取歌曲方法
    async fetchSongsWithRetry(url, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const songs = await this.fetchSongs(url, 5000 + attempt * 1000);
            if (songs && songs.length > 0) {
                return songs;
            }
            
            if (attempt < maxRetries) {
                console.log(`第${attempt}次尝试失败，${attempt * 1000}ms后重试...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
        
        console.error(`经过${maxRetries}次尝试后仍无法获取歌曲`);
        return [];
    },
};
adoreorg.changeMusicBg(false);
