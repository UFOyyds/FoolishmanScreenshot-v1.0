console.log("popup.js 已加载");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM 已加载完成");
    var logoButton = document.getElementById('startScreenshot');
    logoButton.addEventListener('click', startScreenshot);

    // 显示最近的截图
    chrome.storage.local.get(['screenshot'], (result) => {
        if (result.screenshot) {
            var img = document.getElementById('screenshot');
            img.src = result.screenshot;
            img.style.display = 'block';
        }
    });
});

function startScreenshot() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0].url.startsWith("chrome://") || tabs[0].url.startsWith("edge://")) {
            alert("无法在浏览器内部页面上使用截图功能。请在普通网页上尝试。");
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, {action: "start_screenshot"}, (response) => {
            if (chrome.runtime.lastError) {
                console.error("发送消息时出错:", chrome.runtime.lastError);
                // 尝试重新注入 content script
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('执行脚本时出错:', chrome.runtime.lastError);
                        alert("无法启动截图功能，请刷新页面后重试。");
                    } else {
                        // 重新尝试发送消息
                        chrome.tabs.sendMessage(tabs[0].id, {action: "start_screenshot"});
                    }
                });
            } else {
                console.log("截图功能已启动", response);
            }
        });
        window.close();
    });
}