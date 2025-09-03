console.log('script.js 开始加载');

let recognition = null;
let isRecording = false;
let currentText = '';
let selectedFile = null;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，开始初始化');
    
    // 显示启动图片2秒后隐藏
    const splashScreen = document.getElementById('splashScreen');
if (splashScreen) {
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        // 等待过渡动画完成后真正隐藏元素
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 1000); // 与CSS过渡时间保持一致
    }, 2000);
}

    // 获取所有元素
    const elements = {
        // 标签页
        micTab: document.getElementById('micTab'),
        fileTab: document.getElementById('fileTab'),
        micSection: document.getElementById('micSection'),
        fileSection: document.getElementById('fileSection'),
        
        // 录音相关
        micButton: document.getElementById('micButton'),
        statusText: document.getElementById('statusText'),
        
        // 文件上传相关
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('audioFile'),
        fileInfo: document.getElementById('fileInfo'),
        fileName: document.getElementById('fileName'),
        processButton: document.getElementById('processButton'),
        progressContainer: document.getElementById('progressContainer'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        
        // 结果相关
        resultText: document.getElementById('resultText'),
        clearButton: document.getElementById('clearButton'),
        copyButton: document.getElementById('copyButton'),
        downloadButton: document.getElementById('downloadButton'),
        aiSummaryButton: document.getElementById('aiSummaryButton'),
        
        // AI相关
        aiSection: document.getElementById('aiSection'),
        aiResult: document.getElementById('aiResult')
    };
    
    // 检查关键元素
    console.log('micButton:', elements.micButton);
    console.log('uploadArea:', elements.uploadArea);
    console.log('fileInput:', elements.fileInput);
    
    if (!elements.micButton) {
        console.error('找不到麦克风按钮');
        return;
    }
    
    // 初始化语音识别
    initSpeechRecognition();
    
    // 绑定事件
    bindEvents();
    
    console.log('初始化完成');
    
    // 初始化语音识别
    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('浏览器支持语音识别');
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'zh-CN';
            
            recognition.onstart = () => {
                console.log('语音识别已启动');
                isRecording = true;
                elements.micButton.classList.add('recording');
                elements.statusText.textContent = '正在录音...';
                showMessage('开始录音', 'success');
            };
            
            recognition.onresult = (event) => {
                console.log('收到语音识别结果');
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                currentText += finalTranscript;
                displayResult(currentText + interimTranscript);
            };
            
            recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                let errorMessage = '语音识别错误: ';
                switch(event.error) {
                    case 'not-allowed':
                        errorMessage += '请允许麦克风权限';
                        break;
                    case 'no-speech':
                        errorMessage += '未检测到语音';
                        break;
                    case 'network':
                        errorMessage += '网络连接错误';
                        break;
                    default:
                        errorMessage += event.error;
                }
                showMessage(errorMessage, 'error');
                stopRecording();
            };
            
            recognition.onend = () => {
                console.log('语音识别结束');
                stopRecording();
            };
        } else {
            console.error('浏览器不支持语音识别');
            showMessage('浏览器不支持语音识别功能，请使用Chrome或Edge浏览器', 'error');
        }
    }
    
    // 绑定事件
    function bindEvents() {
        function switchPage(page) {
    console.log('切换到页面:', page);
    
    // 隐藏所有内容容器
    document.querySelectorAll('.content-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // 显示目标页面
    const targetContainer = document.getElementById(page === 'meeting' ? 'meetingAssistant' : 'moreFeatures');
    if (targetContainer) {
        targetContainer.classList.add('active');
    }
    
    // 停止任何正在进行的录音
    if (isRecording && recognition) {
        recognition.stop();
    }
}

// 页面切换
if (document.querySelector('.nav-link')) {
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有 active 类
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            // 添加当前 active
            btn.classList.add('active');

            const page = btn.getAttribute('data-page');
            if (page === 'meeting') {
                // 显示主页面
                document.getElementById('mainContent')?.classList.remove('hidden');
                document.getElementById('moreContent')?.classList.add('hidden');
            } else if (page === 'more') {
                // 显示更多功能页面
                document.getElementById('mainContent')?.classList.add('hidden');
                document.getElementById('moreContent')?.classList.remove('hidden');
                
                // 初始化待办列表和用户设置（仅在第一次切换时执行）
                if (!window.todosInitialized) {
                    initTodoList();
                    window.todosInitialized = true;
                }
                
                if (!window.settingsInitialized) {
                    initUserSettings();
                    window.settingsInitialized = true;
                }
            }
        });
    });
}

// 时钟函数
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const clock = document.getElementById('clock');
    if (!clock) return;

    // 获取当前时钟内容
    const currentTime = hours + ':' + minutes + ':' + seconds;
    
    // 如果是第一次运行，直接创建数字
    if (!clock.hasChildNodes()) {
        clock.innerHTML = '';
        const digits = [hours[0], hours[1], ':', minutes[0], minutes[1], ':', seconds[0], seconds[1]];
        digits.forEach(digit => {
            const digitElement = document.createElement('div');
            digitElement.className = 'digit';
            digitElement.textContent = digit;
            digitElement.setAttribute('data-value', digit);
            clock.appendChild(digitElement);
        });
        return;
    }

    // 获取现有的数字元素
    const digitElements = clock.querySelectorAll('.digit');
    const newValues = [hours[0], hours[1], ':', minutes[0], minutes[1], ':', seconds[0], seconds[1]];
    
    // 比较并更新每个数字
    newValues.forEach((newValue, index) => {
        const digitElement = digitElements[index];
        
        // 只有数字发生变化时才添加翻页动画
        if (digitElement.getAttribute('data-value') !== newValue) {
            // 添加翻页动画类
            digitElement.classList.add('flipping');
            
            // 在动画中间更新数字内容
            setTimeout(() => {
                digitElement.textContent = newValue;
                digitElement.setAttribute('data-value', newValue);
            }, 150);
            
            // 移除动画类
            setTimeout(() => {
                digitElement.classList.remove('flipping');
            }, 300);
        }
    });
}

// 确保初始加载时显示时钟
updateClock();
setInterval(updateClock, 1000);

// 用户登录按钮
const userBtn = document.getElementById('userBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginForm = document.getElementById('loginForm');
const navbarUserNickname = document.getElementById('navbarUserNickname');

// 页面加载时检查是否有保存的用户设置
const savedSettings = JSON.parse(localStorage.getItem('userSettings') || 'null');
if (savedSettings && savedSettings.nickname) {
    navbarUserNickname.textContent = savedSettings.nickname;
    navbarUserNickname.style.display = 'block';
} else {
    navbarUserNickname.style.display = 'none';
}

if (userBtn && loginModal && closeLoginModal) {
    userBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });

    // 关闭弹窗按钮
    closeLoginModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    // 关闭弹窗（点击背景）
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // 关闭弹窗（按 ESC）
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            loginModal.style.display = 'none';
        }
    });

    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // 这里添加实际的登录逻辑
            console.log('登录信息:', { username, password, rememberMe });
            
            // 登录成功后关闭弹窗
            loginModal.style.display = 'none';
            showMessage('登录成功', 'success');
        });
    }
}

    // 初始化用户设置功能
function initUserSettings() {
    const nicknameInput = document.getElementById('userNickname');
    const nicknameCount = document.getElementById('nicknameCount');
    const genderOptions = document.querySelectorAll('input[name="userGender"]');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const saveSettingsBtn = document.getElementById('saveSettings');
    const navbarAvatar = document.getElementById('navbarAvatar');
    const navbarNickname = document.getElementById('navbarNickname');
    const navbarUserNickname = document.getElementById('navbarUserNickname');
    const userBtn = document.getElementById('userBtn');
    const defaultIcon = userBtn.querySelector('.default-icon');
    
    if (!nicknameInput || !saveSettingsBtn) return;
    
    // 显示字符计数
    nicknameInput.addEventListener('input', () => {
        const length = nicknameInput.value.length;
        nicknameCount.textContent = `${length}/8`;
        nicknameCount.style.color = length > 8 ? '#ff3b30' : '#86868b';
    });
    
    // 头像选择
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 移除所有选中状态
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            // 添加当前选中状态
            option.classList.add('selected');
        });
    });
    
    // 保存设置
    saveSettingsBtn.addEventListener('click', () => {
        const nickname = nicknameInput.value.trim();
        const selectedGender = document.querySelector('input[name="userGender"]:checked');
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        
        // 验证昵称
        if (nickname.length < 3 || nickname.length > 8) {
            showMessage('昵称必须为3-8个字符', 'error');
            return;
        }
        
        // 获取性别和头像
        const gender = selectedGender ? selectedGender.value : 'secret';
        const avatar = selectedAvatar ? selectedAvatar.dataset.avatar : '';
        
        // 保存到本地存储
        const userSettings = {
            nickname: nickname,
            gender: gender,
            avatar: avatar
        };
        
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        
        // 更新导航栏显示
        updateNavbarUserDisplay(userSettings);
        
        showMessage('设置已保存', 'success');
    });
    
    // 加载已保存的设置
    loadUserSettings();
    
    // 更新导航栏用户显示
    function updateNavbarUserDisplay(settings) {
        // 显示用户昵称在头像旁边
        if (settings && settings.nickname) {
            navbarUserNickname.textContent = settings.nickname;
            navbarUserNickname.style.display = 'block';
        } else {
            navbarUserNickname.style.display = 'none';
        }
        
        // 处理头像显示
        if (settings && settings.nickname) {
            userBtn.classList.add('has-avatar');
            defaultIcon.style.display = 'none';
            
            if (settings.avatar) {
                navbarAvatar.src = settings.avatar;
                navbarAvatar.style.display = 'block';
                navbarNickname.style.display = 'none';
            } else {
                navbarNickname.textContent = settings.nickname.substring(0, 2);
                navbarNickname.style.display = 'block';
                navbarAvatar.style.display = 'none';
            }
        } else {
            userBtn.classList.remove('has-avatar');
            defaultIcon.style.display = 'flex';
            navbarAvatar.style.display = 'none';
            navbarNickname.style.display = 'none';
        }
    }
    
    // 加载用户设置
    function loadUserSettings() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || 'null');
        if (settings) {
            // 填充表单
            document.getElementById('userNickname').value = settings.nickname || '';
            nicknameCount.textContent = `${(settings.nickname || '').length}/8`;
            
            if (settings.gender) {
                const genderRadio = document.querySelector(`input[name="userGender"][value="${settings.gender}"]`);
                if (genderRadio) genderRadio.checked = true;
            }
            
            if (settings.avatar) {
                const avatarOption = document.querySelector(`.avatar-option[data-avatar="${settings.avatar}"]`);
                if (avatarOption) avatarOption.classList.add('selected');
            }
            
            // 更新导航栏显示
            updateNavbarUserDisplay(settings);
        }
    }
}

    // 初始化待办列表功能
function initTodoList() {
    const todoInput = document.getElementById('todoInput');
    const todoDateTime = document.getElementById('todoDateTime');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');
    
    if (!todoInput || !addTodoBtn || !todoList) {
        console.log('待办列表元素未找到');
        return;
    }
    
    // 从本地存储加载待办事项
    loadTodos();
    
    // 添加待办事项
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // 添加待办事项函数
    function addTodo() {
        const text = todoInput.value.trim();
        const dateTime = todoDateTime.value;
        
        if (!text) {
            showMessage('请输入待办事项', 'error');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            dateTime: dateTime,
            completed: false
        };
        
        createTodoElement(todo);
        saveTodos();
        
        // 清空输入框
        todoInput.value = '';
        todoDateTime.value = '';
        todoInput.focus();
    }
    
    // 创建待办事项元素
    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.id = todo.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'todo-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'todo-text';
        textDiv.textContent = todo.text;
        
        const dateTimeDiv = document.createElement('div');
        dateTimeDiv.className = 'todo-datetime-text';
        if (todo.dateTime) {
            const date = new Date(todo.dateTime);
            dateTimeDiv.textContent = date.toLocaleString('zh-CN');
        }
        
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(dateTimeDiv);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete-btn';
        deleteBtn.textContent = '删除';
        
        li.appendChild(checkbox);
        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        
        if (todo.completed) {
            li.classList.add('todo-completed');
        }
        
        // 添加事件监听器
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            if (todo.completed) {
                li.classList.add('todo-completed');
            } else {
                li.classList.remove('todo-completed');
            }
            saveTodos();
        });
        
        deleteBtn.addEventListener('click', () => {
            li.remove();
            saveTodos();
        });
        
        // 将新待办事项添加到列表顶部
        if (todoList.firstChild) {
            todoList.insertBefore(li, todoList.firstChild);
        } else {
            todoList.appendChild(li);
        }
    }
    
    // 保存待办事项到本地存储
    function saveTodos() {
        const todos = [];
        document.querySelectorAll('.todo-item').forEach(item => {
            const id = item.dataset.id;
            const text = item.querySelector('.todo-text').textContent;
            const dateTimeText = item.querySelector('.todo-datetime-text').textContent;
            const completed = item.classList.contains('todo-completed');
            
            todos.push({
                id: id,
                text: text,
                dateTime: dateTimeText ? new Date(dateTimeText).toISOString() : '',
                completed: completed
            });
        });
        
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    
    // 从本地存储加载待办事项
    function loadTodos() {
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        todos.forEach(todo => createTodoElement(todo));
    }
}

        console.log('开始绑定事件');
        
        // 标签页切换
        if (elements.micTab) {
            elements.micTab.addEventListener('click', () => {
                console.log('点击实时录音标签');
                switchTab('mic');
            });
        }
        if (elements.fileTab) {
            elements.fileTab.addEventListener('click', () => {
                console.log('点击音频文件标签');
                switchTab('file');
            });
        }
        
        // 录音按钮
        if (elements.micButton) {
            elements.micButton.addEventListener('click', toggleRecording);
            console.log('麦克风按钮事件已绑定');
        }
        
        // 文件上传
        if (elements.uploadArea) {
            elements.uploadArea.addEventListener('click', () => {
                console.log('上传区域被点击');
                if (elements.fileInput) {
                    console.log('触发文件选择');
                    elements.fileInput.click();
                } else {
                    console.error('找不到文件输入元素');
                }
            });
            
            elements.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                elements.uploadArea.classList.add('dragover');
            });
            
            elements.uploadArea.addEventListener('dragleave', () => {
                elements.uploadArea.classList.remove('dragover');
            });
            
            elements.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                elements.uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileSelect(files[0]);
                }
            });
        }
        
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', (e) => {
                console.log('文件选择事件触发');
                if (e.target.files.length > 0) {
                    console.log('选中文件:', e.target.files[0].name);
                    handleFileSelect(e.target.files[0]);
                } else {
                    console.log('没有选中文件');
                }
            });
            console.log('文件输入事件已绑定');
        } else {
            console.error('找不到文件输入元素');
        }
        
        if (elements.processButton) {
            elements.processButton.addEventListener('click', processAudioFile);
        }
        
        // 控制按钮
        if (elements.clearButton) {
            elements.clearButton.addEventListener('click', clearResult);
        }
        if (elements.copyButton) {
            elements.copyButton.addEventListener('click', copyText);
        }
        if (elements.downloadButton) {
            elements.downloadButton.addEventListener('click', downloadText);
        }
        if (elements.aiSummaryButton) {
            elements.aiSummaryButton.addEventListener('click', generateAiSummary);
        }
        
        console.log('事件绑定完成');
    }
    
    // 切换标签页
    function switchTab(tab) {
        console.log('切换到标签页:', tab);
        
        if (tab === 'mic') {
            elements.micTab?.classList.add('active');
            elements.fileTab?.classList.remove('active');
            elements.micSection?.classList.add('active');
            elements.fileSection?.classList.remove('active');
            
            // 停止任何正在进行的录音
            if (isRecording && recognition) {
                recognition.stop();
            }
        } else if (tab === 'file') {
            elements.micTab?.classList.remove('active');
            elements.fileTab?.classList.add('active');
            elements.micSection?.classList.remove('active');
            elements.fileSection?.classList.add('active');
            
            // 停止任何正在进行的录音
            if (isRecording && recognition) {
                recognition.stop();
            }
        }
    }
    
    // 切换录音状态
    async function toggleRecording() {
        console.log('麦克风按钮被点击，当前状态:', isRecording);
        
        if (!recognition) {
            showMessage('语音识别不可用，请使用Chrome或Edge浏览器', 'error');
            return;
        }
        
        if (isRecording) {
            console.log('停止录音');
            recognition.stop();
        } else {
            console.log('开始录音');
            currentText = '';
            
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('麦克风权限已获取');
                elements.statusText.textContent = '正在启动录音...';
                recognition.start();
            } catch (error) {
                console.error('麦克风权限被拒绝:', error);
                showMessage('请允许麦克风权限后重试', 'error');
            }
        }
    }
    
    // 停止录音
    function stopRecording() {
        isRecording = false;
        elements.micButton?.classList.remove('recording');
        if (elements.statusText) {
            elements.statusText.textContent = '点击麦克风开始录音';
        }
    }
    
    // 显示结果
    function displayResult(text) {
    if (elements.resultText) {
        elements.resultText.value = text;
        elements.resultText.classList.remove('placeholder');
        
        // 启用控制按钮
        if (elements.copyButton) elements.copyButton.disabled = false;
        if (elements.downloadButton) elements.downloadButton.disabled = false;
        if (elements.aiSummaryButton) elements.aiSummaryButton.disabled = false;
    }
}
    
    // 清空结果
    function clearResult() {
        if (elements.resultText) {
            elements.resultText.innerHTML = '<div class="placeholder">转换的文字将显示在这里...</div>';
            elements.resultText.classList.add('placeholder');
        }
        currentText = '';
        
        // 禁用控制按钮
        if (elements.copyButton) elements.copyButton.disabled = true;
        if (elements.downloadButton) elements.downloadButton.disabled = true;
        if (elements.aiSummaryButton) elements.aiSummaryButton.disabled = true;
        
        // 隐藏AI分析
        if (elements.aiSection) elements.aiSection.style.display = 'none';
    }
    
    // 复制文本
    async function copyText() {
        const text = elements.resultText?.value;
        if (text && !text.includes('转换的文字将显示在这里')) {
            try {
                await navigator.clipboard.writeText(text);
                showMessage('文字已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('复制失败，请手动选择文字复制', 'error');
            }
        }
    }
    
    // 下载文档
    function downloadText() {
        const text = elements.resultText?.value;
        if (!text || text.includes('转换的文字将显示在这里')) {
            showMessage('没有可下载的内容', 'error');
            return;
        }
        
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN');
        
        const docContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: "微软雅黑", Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { text-align: justify; text-indent: 2em; }
        .footer { text-align: right; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>语音转文字结果</h1>
    </div>
    <div class="content">
        <p>${text}</p>
    </div>
    <div class="footer">
        <p>生成时间：${timestamp}</p>
    </div>
</body>
</html>`;
        
        const blob = new Blob([docContent], { 
            type: 'application/msword;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `语音转文字_${Date.now()}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('Word文档已下载', 'success');
    }
    
    // 处理文件选择
    function handleFileSelect(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
        
        if (file.size > maxSize) {
            showMessage('文件大小不能超过50MB', 'error');
            return;
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
            showMessage('请选择MP3、WAV或M4A格式的音频文件', 'error');
            return;
        }
        
        if (elements.fileName) elements.fileName.textContent = file.name;
        if (elements.fileInfo) elements.fileInfo.style.display = 'block';
        if (elements.processButton) elements.processButton.disabled = false;
        selectedFile = file;
        console.log('文件已选择:', file.name);
    }
    
    // 处理音频文件
    function processAudioFile() {
        if (!selectedFile) {
            showMessage('请先选择音频文件', 'error');
            return;
        }
        
        if (elements.progressContainer) elements.progressContainer.style.display = 'block';
        if (elements.processButton) elements.processButton.disabled = true;
        
        // 模拟音频处理过程
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                completeAudioProcessing();
            }
            
            if (elements.progressFill) elements.progressFill.style.width = progress + '%';
            if (elements.progressText) elements.progressText.textContent = `处理中... ${Math.round(progress)}%`;
        }, 200);
    }
    
    // 完成音频处理
    function completeAudioProcessing() {
        // 尝试使用Web Speech API处理音频文件
        processAudioWithWebAPI();
    }
    
    // 使用Web Speech API处理音频文件
    function processAudioWithWebAPI() {
        if (!selectedFile) {
            showMessage('没有选择文件', 'error');
            return;
        }
        
        // 创建音频元素
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(selectedFile);
        audio.src = url;
        
        // 尝试播放音频并使用语音识别
        audio.addEventListener('loadeddata', () => {
            console.log('音频文件加载完成');
            
            if (recognition) {
                // 重置识别器
                currentText = '';
                
                // 播放音频时启动识别
                audio.addEventListener('play', () => {
                    console.log('开始播放音频，启动识别');
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error('启动识别失败:', error);
                        showFallbackResult();
                    }
                });
                
                audio.addEventListener('ended', () => {
                    console.log('音频播放结束');
                    recognition.stop();
                    setTimeout(() => {
                        if (elements.progressContainer) elements.progressContainer.style.display = 'none';
                        if (elements.processButton) elements.processButton.disabled = false;
                        if (elements.progressFill) elements.progressFill.style.width = '0%';
                        
                        if (currentText.trim()) {
                            showMessage('音频识别完成', 'success');
                        } else {
                            showFallbackResult();
                        }
                    }, 1000);
                });
                
                // 设置音量并播放
                audio.volume = 1.0;
                audio.play().catch(error => {
                    console.error('播放音频失败:', error);
                    showFallbackResult();
                });
                
            } else {
                showFallbackResult();
            }
        });
        
        audio.addEventListener('error', (error) => {
            console.error('音频加载失败:', error);
            showFallbackResult();
        });
    }
    
    // 显示备用结果
    function showFallbackResult() {
        const fallbackMessage = `
        <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;">
            <h4>⚠️ 音频文件识别说明</h4>
            <p><strong>当前限制：</strong>浏览器的Web Speech API主要支持实时麦克风输入，对音频文件的直接识别支持有限。</p>
            
            <h4>💡 建议的解决方案：</h4>
            <ol>
                <li><strong>播放识别法：</strong>
                    <ul>
                        <li>播放音频文件，同时使用实时录音功能</li>
                        <li>确保音频清晰，环境安静</li>
                    </ul>
                </li>
                <li><strong>专业服务：</strong>
                    <ul>
                        <li>使用百度语音识别API</li>
                        <li>使用腾讯云语音识别</li>
                        <li>使用阿里云智能语音</li>
                    </ul>
                </li>
                <li><strong>本地软件：</strong>
                    <ul>
                        <li>使用专业的语音转文字软件</li>
                        <li>如：讯飞听见、网易见外等</li>
                    </ul>
                </li>
            </ol>
            
            <p><strong>文件信息：</strong>${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
        </div>
        `;
        
        displayResult('');
        if (elements.resultText) {
            elements.resultText.innerHTML = fallbackMessage;
        }
        
        setTimeout(() => {
            if (elements.progressContainer) elements.progressContainer.style.display = 'none';
            if (elements.processButton) elements.processButton.disabled = false;
            if (elements.progressFill) elements.progressFill.style.width = '0%';
            showMessage('请参考建议的识别方案', 'error');
        }, 500);
    }
    
    // 生成AI总结
    async function generateAiSummary() {
        const text = elements.resultText?.value;
        if (!text || text.includes('转换的文字将显示在这里')) {
            showMessage('请先进行语音转文字', 'error');
            return;
        }
        
        // 显示AI分析区域
        if (elements.aiSection) elements.aiSection.style.display = 'block';
        if (elements.aiResult) {
            elements.aiResult.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div>AI正在分析内容...</div>';
        }
        
        try {
            const summary = await callGLMAPI(text);
            if (elements.aiResult) {
                elements.aiResult.innerHTML = formatAISummary(summary);
            }
        } catch (error) {
            console.error('AI总结失败:', error);
            if (elements.aiResult) {
                elements.aiResult.innerHTML = `
                    <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;">
                        <h4>⚠️ AI总结失败</h4>
                        <p>无法连接到AI服务，请检查网络连接后重试。</p>
                        <p>错误信息：${error.message}</p>
                    </div>
                `;
            }
            showMessage('AI总结失败，请重试', 'error');
        }
    }
    
    // 调用GLM API
    async function callGLMAPI(text) {
        const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        const apiKey = '2a783d7126574de796e370c51d45790b.jimhAdCuGmWAstOb';
        
        const requestBody = {
            model: "glm-4-flash",
            messages: [
                {
                    role: "system",
                    content: "你是一个专业的文本分析助手。请对用户提供的文本进行智能总结，包括：1. 主要内容概括 2. 关键信息提取 3. 重要观点归纳 4.生成计划表。请用中文回复，格式清晰易读。"
                },
                {
                    role: "user",
                    content: `请对以下文本进行智能总结分析：\n\n${text}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'API返回错误');
        }
        
        return data.choices[0].message.content;
    }
    
    // 格式化AI总结结果
    function formatAISummary(summary) {
        return `
            <div style="padding: 20px; background: #f8f9fa; border-radius: 12px; line-height: 1.8;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <svg style="width: 24px; height: 24px; margin-right: 8px; color: #007aff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                    <h4 style="color: #007aff; margin: 0;">🤖 GLM-4.5-Flash AI总结</h4>
                </div>
                <div style="white-space: pre-wrap; color: #333; font-size: 14px;">
                    ${summary.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                    <span>✨ 由智谱AI GLM-4.5-Flash模型生成</span>
                </div>
            </div>
        `;
    }
    
    // 显示消息
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background: ${type === 'success' ? '#34c759' : '#ff3b30'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});

console.log('script.js 加载完成');