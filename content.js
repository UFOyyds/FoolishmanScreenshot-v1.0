console.log("content.js 已加载");

let isSelecting = false;
let startX, startY;
let selectionElement, screenshotArea;

function createSelectionArea() {
    console.log("创建选择区域");
    screenshotArea = document.createElement('div');
    screenshotArea.style.position = 'fixed';
    screenshotArea.style.top = '0';
    screenshotArea.style.left = '0';
    screenshotArea.style.width = '100%';
    screenshotArea.style.height = '100%';
    screenshotArea.style.backgroundColor = 'transparent';
    screenshotArea.style.cursor = 'crosshair';
    screenshotArea.style.zIndex = '2147483647';
    document.body.appendChild(screenshotArea);

    screenshotArea.addEventListener('mousedown', startSelection);
    screenshotArea.addEventListener('mousemove', updateSelection);
    screenshotArea.addEventListener('mouseup', endSelection);
}

function startSelection(e) {
    console.log("开始选择");
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionElement = document.createElement('div');
    selectionElement.style.position = 'fixed';
    selectionElement.style.border = '2px solid red';
    selectionElement.style.backgroundColor = 'transparent';
    selectionElement.style.pointerEvents = 'none';
    selectionElement.style.boxSizing = 'border-box';
    screenshotArea.appendChild(selectionElement);
}

function updateSelection(e) {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionElement.style.left = `${left}px`;
    selectionElement.style.top = `${top}px`;
    selectionElement.style.width = `${width}px`;
    selectionElement.style.height = `${height}px`;
}

function endSelection(e) {
    console.log("结束选择");
    isSelecting = false;
    const rect = selectionElement.getBoundingClientRect();
    console.log("选择区域:", rect);
    
    captureScreenshot(rect);
}

function captureScreenshot(rect) {
    console.log("开始截图");
    const devicePixelRatio = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
        action: 'captureScreen',
        area: {
            x: Math.round(rect.left * devicePixelRatio),
            y: Math.round(rect.top * devicePixelRatio),
            width: Math.round(rect.width * devicePixelRatio),
            height: Math.round(rect.height * devicePixelRatio)
        }
    }, response => {
        if (chrome.runtime.lastError) {
            console.error('发送消息时出错:', chrome.runtime.lastError);
        } else if (response && response.success) {
            console.log('截图请求已发送');
        }
        document.body.removeChild(screenshotArea);
    });
}

function cropScreenshot(dataUrl, area) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = area.width;
        canvas.height = area.height;
        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
        
        const croppedDataUrl = canvas.toDataURL('image/png');
        
        // 保存裁剪后的截图
        chrome.runtime.sendMessage({
            action: 'saveScreenshot',
            dataUrl: croppedDataUrl
        }, response => {
            if (chrome.runtime.lastError) {
                console.error('保存截图时出错:', chrome.runtime.lastError);
            } else if (response && response.success) {
                console.log('截图已成功保存');
            } else {
                console.error('截图保存失败');
            }
        });
    };
    img.src = dataUrl;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("content.js 收到消息:", request);
    if (request.action === "start_screenshot") {
        console.log("开始截图");
        createSelectionArea();
        sendResponse({success: true});
    } else if (request.action === "cropScreenshot") {
        cropScreenshot(request.dataUrl, request.area);
        sendResponse({success: true});
    }
    return true;  // 保持消息通道开放
});

// 确保 content script 已经准备好接收消息
chrome.runtime.sendMessage({action: "content_script_ready"}, (response) => {
    if (chrome.runtime.lastError) {
        console.error("发送 content_script_ready 消息时出错:", chrome.runtime.lastError);
    } else {
        console.log("content_script_ready 消息已发送", response);
    }
});