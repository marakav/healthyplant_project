// Хранилище данных в LocalStorage
class DataStorage {
    static getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    static saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    static setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('currentUser');
    }

    static getFlowers() {
        return JSON.parse(localStorage.getItem('flowers')) || [];
    }

    static saveFlowers(flowers) {
        localStorage.setItem('flowers', JSON.stringify(flowers));
    }

    static getTokens() {
        return JSON.parse(localStorage.getItem('tokens')) || [];
    }

    static saveTokens(tokens) {
        localStorage.setItem('tokens', JSON.stringify(tokens));
    }
}

// Функции для работы с модальными окнами
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Регистрация
function registerUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    // Валидация
    if (password !== confirmPassword) {
        showFlashMessage('Пароли не совпадают!', 'error');
        return;
    }
    
    if (!document.getElementById('privacyPolicy').checked) {
        showFlashMessage('Необходимо согласиться с обработкой персональных данных', 'error');
        return;
    }
    
    // Проверка существования пользователя
    const users = DataStorage.getUsers();
    if (users.find(u => u.email === email)) {
        showFlashMessage('Пользователь с таким email уже существует!', 'error');
        return;
    }
    
    // Создание нового пользователя
    const newUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        password: password,
        created_at: new Date().toISOString().split('T')[0],
        flowers: [],
        analysis_count: 0
    };
    
    users.push(newUser);
    DataStorage.saveUsers(users);
    DataStorage.setCurrentUser(newUser);
    
    closeModal('registerModal');
    showFlashMessage(`Добро пожаловать, ${username}!`, 'success');
    updateUI();
}

// Вход
function loginUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const users = DataStorage.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        DataStorage.setCurrentUser(user);
        closeModal('loginModal');
        showFlashMessage(`Добро пожаловать, ${user.username}!`, 'success');
        updateUI();
    } else {
        showFlashMessage('Неверный email или пароль!', 'error');
    }
}

// Выход
function logout() {
    DataStorage.logout();
    showFlashMessage('Вы успешно вышли из системы!', 'info');
    updateUI();
}

// Обновление интерфейса
function updateUI() {
    const user = DataStorage.getCurrentUser();
    const navButtons = document.getElementById('navButtons');
    const userInfo = document.getElementById('userInfo');
    const guestContent = document.getElementById('guestContent');
    const authRequired = document.getElementById('authRequired');
    
    if (user) {
        // Обновление навигации
        navButtons.innerHTML = `
            <span class="nav-username">Привет, ${user.username}!</span>
            <a href="#account" onclick="showAccountPage()" class="button button-outline">Мой аккаунт</a>
            <button class="button button-outline" onclick="logout()">Выйти</button>
        `;
        
        // Обновление героя
        userInfo.style.display = 'block';
        guestContent.style.display = 'none';
        document.getElementById('userGreeting').textContent = `Добро пожаловать, ${user.username}!`;
        document.getElementById('analysisCount').textContent = user.analysis_count || 0;
        document.getElementById('flowersCount').textContent = user.flowers ? user.flowers.length : 0;
        
        // Скрываем требование авторизации
        if (authRequired) authRequired.style.display = 'none';
        
        // Обновляем профиль
        if (document.getElementById('profileUsername')) {
            document.getElementById('profileUsername').textContent = user.username;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileAnalysisCount').textContent = user.analysis_count || 0;
            document.getElementById('profileFlowersCount').textContent = user.flowers ? user.flowers.length : 0;
            document.getElementById('profileRegDate').textContent = user.created_at;
        }
    } else {
        // Гостевой режим
        navButtons.innerHTML = `
            <button class="button button-outline" onclick="openModal('loginModal')">Войти</button>
            <button class="button" onclick="openModal('registerModal')">Регистрация</button>
        `;
        
        if (userInfo) userInfo.style.display = 'none';
        if (guestContent) guestContent.style.display = 'block';
        if (authRequired) authRequired.style.display = 'block';
        
        // Показываем главную страницу
        document.getElementById('accountPage').style.display = 'none';
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== 'accountPage') {
                section.style.display = 'block';
            }
        });
    }
}

// Показать аккаунт
function showAccountPage() {
    document.getElementById('accountPage').style.display = 'block';
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'accountPage' && !section.classList.contains('nav')) {
            section.style.display = 'none';
        }
    });
    showSection('analyze-plant');
    
    // Прокрутка вверх
    window.scrollTo(0, 0);
}

// Показать секцию в аккаунте
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.account-section-content').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показать выбранную секцию
    const sectionToShow = document.getElementById(sectionId + '-section');
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
    
    // Обновить активное меню
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Загрузить цветы если нужно
    if (sectionId === 'my-flowers') {
        loadUserFlowers();
    }
}

// Генерация токена
function generateToken() {
    const user = DataStorage.getCurrentUser();
    if (!user) {
        showFlashMessage('Сначала войдите в систему!', 'error');
        return;
    }
    
    // Генерация токена
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    // Сохранение токена
    const tokens = DataStorage.getTokens();
    tokens.push({
        user_id: user.id,
        token: token,
        created_at: new Date().toISOString(),
        status: 'active'
    });
    DataStorage.saveTokens(tokens);
    
    // Показать токен
    document.getElementById('generatedToken').textContent = token;
    document.getElementById('tokenResult').style.display = 'block';
    
    showFlashMessage('Токен успешно сгенерирован! Скопируйте его и отправьте боту.', 'success');
}

// Копирование токена
function copyTokenToClipboard() {
    const token = document.getElementById('generatedToken').textContent;
    navigator.clipboard.writeText(token).then(() => {
        showFlashMessage('Токен скопирован в буфер обмена!', 'success');
    }).catch(err => {
        showFlashMessage('Не удалось скопировать токен', 'error');
    });
}

// Отправка токена
function submitTokenForm(event) {
    event.preventDefault();
    
    const tokenInput = document.getElementById('tokenInput');
    const token = tokenInput.value.trim();
    
    if (!token) {
        showTokenStatus('Введите токен', 'error');
        return;
    }
    
    // Имитация анализа (в реальности запрос к серверу)
    const mockAnalysis = {
        plant_name: "Фикус Бенджамина",
        plant_type: "Декоративно-лиственное",
        description: "Популярное комнатное растение с мелкими листьями",
        watering: "1-2 раза в неделю летом, 1 раз в 10 дней зимой",
        light: "Яркий рассеянный свет",
        temperature: "18-24°C",
        humidity: "Средняя, опрыскивать листья",
        fertilizer: "Раз в 2 недели с марта по сентябрь",
        problems: ["Сухие кончики листьев", "Пожелтение нижних листьев"],
        health_status: "good",
        image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop"
    };
    
    // Сохраняем анализ
    const user = DataStorage.getCurrentUser();
    if (user) {
        const flowers = DataStorage.getFlowers();
        const newFlower = {
            id: Date.now().toString(),
            user_id: user.id,
            token: token,
            name: mockAnalysis.plant_name,
            type: mockAnalysis.plant_type,
            description: mockAnalysis.description,
            watering: mockAnalysis.watering,
            light: mockAnalysis.light,
            temperature: mockAnalysis.temperature,
            humidity: mockAnalysis.humidity,
            fertilizer: mockAnalysis.fertilizer,
            problems: mockAnalysis.problems,
            health_status: mockAnalysis.health_status,
            image_url: mockAnalysis.image_url,
            analysis_date: new Date().toISOString(),
            added_date: new Date().toISOString()
        };
        
        flowers.push(newFlower);
        DataStorage.saveFlowers(flowers);
        
        // Обновляем пользователя
        const users = DataStorage.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            if (!users[userIndex].flowers) users[userIndex].flowers = [];
            users[userIndex].flowers.push({
                id: newFlower.id,
                name: newFlower.name,
                type: newFlower.type,
                analysis_date: newFlower.analysis_date,
                added_date: newFlower.added_date
            });
            users[userIndex].analysis_count = users[userIndex].flowers.length;
            DataStorage.saveUsers(users);
            DataStorage.setCurrentUser(users[userIndex]);
        }
        
        // Показываем результат
        showAnalysisResult(mockAnalysis);
        showTokenStatus('Анализ успешно получен и сохранен!', 'success');
        tokenInput.value = '';
    }
}

// Показать результат анализа
function showAnalysisResult(analysis) {
    document.getElementById('flowerResult').style.display = 'block';
    document.getElementById('flowerName').textContent = analysis.plant_name;
    document.getElementById('flowerType').textContent = analysis.plant_type;
    
    // Уход
    document.getElementById('flowerCare').innerHTML = `
        <h4>Рекомендации по уходу:</h4>
        <p><strong>Полив:</strong> ${analysis.watering}</p>
        <p><strong>Освещение:</strong> ${analysis.light}</p>
        <p><strong>Температура:</strong> ${analysis.temperature}</p>
        <p><strong>Влажность:</strong> ${analysis.humidity}</p>
        <p><strong>Удобрение:</strong> ${analysis.fertilizer}</p>
    `;
    
    // Проблемы
    if (analysis.problems && analysis.problems.length > 0) {
        document.getElementById('flowerProblems').style.display = 'block';
        const problemsHtml = analysis.problems.map(p => `<li>${p}</li>`).join('');
        document.getElementById('flowerProblems').innerHTML = `
            <h4>Обнаруженные проблемы:</h4>
            <ul>${problemsHtml}</ul>
        `;
    }
    
    // Изображение
    if (analysis.image_url) {
        document.getElementById('flowerResultImage').src = analysis.image_url;
    }
    
    // Прокрутка к результату
    document.getElementById('flowerResult').scrollIntoView({ behavior: 'smooth' });
}

// Загрузка цветов пользователя
function loadUserFlowers() {
    const user = DataStorage.getCurrentUser();
    if (!user) return;
    
    const flowers = DataStorage.getFlowers();
    const userFlowers = flowers.filter(f => f.user_id === user.id);
    
    const container = document.getElementById('flowersContainer');
    
    if (userFlowers.length > 0) {
        let html = '<div class="my-flowers-grid">';
        
        userFlowers.forEach(flower => {
            html += `
                <div class="flower-card">
                    ${flower.image_url ? 
                        `<img src="${flower.image_url}" alt="${flower.name}">` : 
                        `<div style="height: 180px; background: linear-gradient(135deg, var(--green-medium) 0%, var(--green-light) 100%); display: flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 1em;">
                            <span style="color: white; font-size: 2em;">🌿</span>
                        </div>`
                    }
                    <h3>${flower.name}</h3>
                    <p><strong>Тип:</strong> ${flower.type}</p>
                    <p><strong>Дата анализа:</strong> ${new Date(flower.analysis_date).toLocaleDateString()}</p>
                    <div class="care-details">
                        <h4>Уход:</h4>
                        <p><strong>Полив:</strong> ${flower.watering}</p>
                        <p><strong>Освещение:</strong> ${flower.light}</p>
                        <p><strong>Температура:</strong> ${flower.temperature}</p>
                    </div>
                    ${flower.problems && flower.problems.length > 0 ? 
                        `<div class="problem-list">
                            <h4>Проблемы:</h4>
                            <ul>${flower.problems.map(p => `<li>${p}</li>`).join('')}</ul>
                        </div>` : ''
                    }
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    } else {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <p style="font-size: 18px; margin-bottom: 20px;">У вас пока нет проанализированных цветков.</p>
                <p style="margin-bottom: 30px;">Сначала получите токен и отправьте фото растения боту.</p>
                <a href="#analyze-plant" onclick="showSection('analyze-plant')" class="button">🔍 Проанализировать первый цветок</a>
            </div>
        `;
    }
}

// Статус токена
function showTokenStatus(message, type = 'error') {
    const tokenStatus = document.getElementById('tokenStatus');
    if (tokenStatus) {
        const className = type === 'error' ? 'flash-error' : 'flash-success';
        tokenStatus.innerHTML = `<div class="flash-message ${className}">${message}</div>`;
        tokenStatus.style.display = 'block';
        tokenStatus.scrollIntoView({ behavior: 'smooth' });
    }
}

// Flash сообщения
function showFlashMessage(message, type = 'info') {
    const container = document.getElementById('flashMessages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flash-message flash-${type}`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация форм
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
    
    const tokenForm = document.getElementById('tokenForm');
    if (tokenForm) {
        tokenForm.addEventListener('submit', submitTokenForm);
    }
    
    // Обработка модальных окон
    window.onclick = function(event) {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    };
    
    // Escape для закрытия модалок
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modals = document.getElementsByClassName('modal');
            for (let modal of modals) {
                modal.style.display = 'none';
            }
        }
    });
    
    // Проверка хэша в URL
    if (window.location.hash === '#account') {
        const user = DataStorage.getCurrentUser();
        if (user) {
            showAccountPage();
        }
    }
    
    // Обновляем UI
    updateUI();
    
    // Инициализация начальных данных если их нет
    const users = DataStorage.getUsers();
    if (users.length === 0) {
        // Создаем тестового пользователя
        const testUser = {
            id: "1",
            username: "Тестовый пользователь",
            email: "test@example.com",
            password: "12345678",
            created_at: new Date().toISOString().split('T')[0],
            flowers: [],
            analysis_count: 0
        };
        users.push(testUser);
        DataStorage.saveUsers(users);
    }
});
