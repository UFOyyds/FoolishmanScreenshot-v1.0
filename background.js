let contentScriptReady = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);
    if (request.action === "content_script_ready") {
        contentScriptReady = true;
        console.log("Content script 已准备就绪");
        sendResponse({received: true});
    } else if (request.action === 'captureScreen') {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
            // 将完整截图发送回 content script 进行裁剪
            chrome.tabs.sendMessage(sender.tab.id, {
                action: 'cropScreenshot',
                dataUrl: dataUrl,
                area: request.area
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('发送裁剪消息时出错:', chrome.runtime.lastError);
                } else {
                    console.log('裁剪消息已发送');
                }
                sendResponse({success: true});
            });
        });
        return true; // 保持消息通道开放
    } else if (request.action === 'saveScreenshot') {
        chrome.storage.local.set({screenshot: request.dataUrl}, () => {
            console.log('裁剪后的截图已保存');
            sendResponse({success: true});
        });
        return true; // 保持消息通道开放
    }
    return true; // 保持消息通道开放
});

chrome.action.onClicked.addListener((tab) => {
    if (contentScriptReady) {
        chrome.tabs.sendMessage(tab.id, {action: "start_screenshot"}, response => {
            if (chrome.runtime.lastError) {
                console.error('发送开始截图消息时出错:', chrome.runtime.lastError);
            } else {
                console.log('开始截图消息已发送');
            }
        });
    } else {
        console.error("Content script 尚未准备就绪");
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('执行脚本时出错:', chrome.runtime.lastError);
            } else {
                chrome.tabs.sendMessage(tab.id, {action: "start_screenshot"}, response => {
                    if (chrome.runtime.lastError) {
                        console.error('发送开始截图消息时出错:', chrome.runtime.lastError);
                    } else {
                        console.log('开始截图消息已发送');
                    }
                });
            }
        });
    }
});

// 添加右键菜单项
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'captureScreen',
        title: '截取屏幕',
        contexts: ['all']
    });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'captureScreen') {
        chrome.tabs.sendMessage(tab.id, {action: 'start_screenshot'}, response => {
            if (chrome.runtime.lastError) {
                console.error('发送开始截图消息时出错:', chrome.runtime.lastError);
            } else {
                console.log('开始截图消息已发送');
            }
        });
    }
});