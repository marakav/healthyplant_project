// Хранилище данных в LocalStorage
class DataStorage {
    static getUsers() {
        return JSON.parse(localStorage.getItem('healthyplant_users')) || [];
    }

    static saveUsers(users) {
        localStorage.setItem('healthyplant_users', JSON.stringify(users));
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('healthyplant_currentUser'));
    }

    static setCurrentUser(user) {
        localStorage.setItem('healthyplant_currentUser', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('healthyplant_currentUser');
    }

    static getFlowers() {
        return JSON.parse(localStorage.getItem('healthyplant_flowers')) || [];
    }

    static saveFlowers(flowers) {
        localStorage.setItem('healthyplant_flowers', JSON.stringify(flowers));
    }

    static getTokens() {
        return JSON.parse(localStorage.getItem('healthyplant_tokens')) || [];
    }

    static saveTokens(tokens) {
        localStorage.setItem('healthyplant_tokens', JSON.stringify(tokens));
    }

    static getAnalyses() {
        return JSON.parse(localStorage.getItem('healthyplant_analyses')) || [];
    }

    static saveAnalyses(analyses) {
        localStorage.setItem('healthyplant_analyses', JSON.stringify(analyses));
    }
}

// Функции для работы с модальными окнами
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Показать аккаунт
function showAccountPage() {
    const user = DataStorage.getCurrentUser();
    if (!user) {
        showFlashMessage('Сначала войдите в систему!', 'error');
        openModal('loginModal');
        return;
    }
    
    openModal('accountModal');
    updateAccountInfo();
    showSection('analyze-plant');
}

// Обновление информации в аккаунте
function updateAccountInfo() {
    const user = DataStorage.getCurrentUser();
    if (!user) return;
    
    // Обновляем профиль
    document.getElementById('profileUsername').textContent = user.username || 'Пользователь';
    document.getElementById('profileEmail').textContent = user.email || 'Не указан';
    document.getElementById('profileAnalysisCount').textContent = user.analysis_count || 0;
    document.getElementById('profileFlowersCount').textContent = user.flowers ? user.flowers.length : 0;
    document.getElementById('profileRegDate').textContent = user.created_at ? user.created_at.split('T')[0] : 'Не указана';
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
        id: 'user_' + Date.now().toString(),
        username: username,
        email: email,
        password: password,
        created_at: new Date().toISOString(),
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
    closeModal('accountModal');
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
            <button class="button button-outline" onclick="showAccountPage()">Мой аккаунт</button>
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
    } else {
        // Гостевой режим
        navButtons.innerHTML = `
            <button class="button button-outline" onclick="openModal('loginModal')">Войти</button>
            <button class="button" onclick="openModal('registerModal')">Регистрация</button>
        `;
        
        if (userInfo) userInfo.style.display = 'none';
        if (guestContent) guestContent.style.display = 'block';
        if (authRequired) authRequired.style.display = 'block';
    }
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
    
    // Обновить профиль если нужно
    if (sectionId === 'profile') {
        updateAccountInfo();
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
    
    showTokenStatus('Токен успешно сгенерирован! Скопируйте его и отправьте боту.', 'success');
}

// Копирование токена
function copyTokenToClipboard() {
    const token = document.getElementById('generatedToken').textContent;
    navigator.clipboard.writeText(token).then(() => {
        showTokenStatus('Токен скопирован в буфер обмена!', 'success');
    }).catch(err => {
        showTokenStatus('Не удалось скопировать токен', 'error');
    });
}

// Отправка токена (имитация получения анализа от бота)
function submitTokenForm(event) {
    event.preventDefault();
    
    const tokenInput = document.getElementById('tokenInput');
    const token = tokenInput.value.trim();
    
    if (!token) {
        showTokenStatus('Введите токен', 'error');
        return;
    }
    
    // Проверяем токен
    const tokens = DataStorage.getTokens();
    const tokenData = tokens.find(t => t.token === token);
    
    if (!tokenData) {
        showTokenStatus('Токен не найден', 'error');
        return;
    }
    
    if (tokenData.status !== 'active') {
        showTokenStatus('Токен уже использован', 'error');
        return;
    }
    
    const user = DataStorage.getCurrentUser();
    if (!user || tokenData.user_id !== user.id) {
        showTokenStatus('Этот токен принадлежит другому пользователю', 'error');
        return;
    }
    
    // Имитация анализа от бота (в реальности будет приходить от сервера)
    const mockAnalyses = [
        {
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
        },
        {
            plant_name: "Спатифиллум",
            plant_type: "Цветущее",
            description: "Растение с красивыми белыми цветами, также известное как 'Женское счастье'",
            watering: "2-3 раза в неделю, почва должна быть всегда влажной",
            light: "Полутень, избегать прямых солнечных лучей",
            temperature: "20-25°C",
            humidity: "Высокая, ежедневное опрыскивание",
            fertilizer: "Раз в 2 недели в период цветения",
            problems: ["Коричневые кончики листьев", "Отсутствие цветения"],
            health_status: "good",
            image_url: "https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400&h=300&fit=crop"
        },
        {
            plant_name: "Замиокулькас",
            plant_type: "Сукулент",
            description: "Неприхотливое растение с глянцевыми листьями",
            watering: "Раз в 2-3 недели, умеренный полив",
            light: "Рассеянный свет, переносит тень",
            temperature: "18-25°C",
            humidity: "Низкая, не требует опрыскивания",
            fertilizer: "Раз в месяц в весенне-летний период",
            problems: ["Переувлажнение почвы", "Пожелтение листьев"],
            health_status: "excellent",
            image_url: "https://images.unsplash.com/photo-1517191434949-5e90cd67d2b6?w=400&h=300&fit=crop"
        }
    ];
    
    // Выбираем случайный анализ
    const analysis = mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
    
    // Помечаем токен как использованный
    tokenData.status = 'used';
    tokenData.used_at = new Date().toISOString();
    DataStorage.saveTokens(tokens);
    
    // Сохраняем анализ
    const analyses = DataStorage.getAnalyses();
    const analysisRecord = {
        id: 'analysis_' + Date.now().toString(),
        user_id: user.id,
        token: token,
        plant_name: analysis.plant_name,
        plant_type: analysis.plant_type,
        description: analysis.description,
        watering: analysis.watering,
        light: analysis.light,
        temperature: analysis.temperature,
        humidity: analysis.humidity,
        fertilizer: analysis.fertilizer,
        problems: analysis.problems,
        health_status: analysis.health_status,
        image_url: analysis.image_url,
        created_at: new Date().toISOString(),
        status: 'completed'
    };
    
    analyses.push(analysisRecord);
    DataStorage.saveAnalyses(analyses);
    
    // Сохраняем цветок у пользователя
    const users = DataStorage.getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
        if (!users[userIndex].flowers) users[userIndex].flowers = [];
        
        const flowerRecord = {
            id: 'flower_' + Date.now().toString(),
            name: analysis.plant_name,
            type: analysis.plant_type,
            description: analysis.description,
            watering: analysis.watering,
            light: analysis.light,
            temperature: analysis.temperature,
            humidity: analysis.humidity,
            fertilizer: analysis.fertilizer,
            problems: analysis.problems,
            health_status: analysis.health_status,
            image_url: analysis.image_url,
            analysis_date: new Date().toISOString(),
            added_date: new Date().toISOString()
        };
        
        users[userIndex].flowers.push(flowerRecord);
        users[userIndex].analysis_count = users[userIndex].flowers.length;
        DataStorage.saveUsers(users);
        DataStorage.setCurrentUser(users[userIndex]);
    }
    
    // Показываем результат
    showAnalysisResult(analysis);
    showTokenStatus('Анализ успешно получен и сохранен!', 'success');
    tokenInput.value = '';
    
    // Обновляем UI
    updateUI();
    updateAccountInfo();
}

// Показать результат анализа
function showAnalysisResult(analysis) {
    const flowerResult = document.getElementById('flowerResult');
    flowerResult.style.display = 'block';
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
    const flowerProblems = document.getElementById('flowerProblems');
    if (analysis.problems && analysis.problems.length > 0) {
        flowerProblems.style.display = 'block';
        const problemsHtml = analysis.problems.map(p => `<li>${p}</li>`).join('');
        flowerProblems.innerHTML = `
            <h4>Обнаруженные проблемы:</h4>
            <ul>${problemsHtml}</ul>
        `;
    } else {
        flowerProblems.style.display = 'none';
    }
    
    // Изображение
    if (analysis.image_url) {
        document.getElementById('flowerResultImage').src = analysis.image_url;
    }
    
    // Прокрутка к результату
    flowerResult.scrollIntoView({ behavior: 'smooth' });
}

// Загрузка цветов пользователя
function loadUserFlowers() {
    const user = DataStorage.getCurrentUser();
    if (!user) return;
    
    const container = document.getElementById('flowersContainer');
    
    if (user.flowers && user.flowers.length > 0) {
        let html = '<div class="my-flowers-grid">';
        
        user.flowers.forEach(flower => {
            html += `
                <div class="flower-card">
                    ${flower.image_url ? 
                        `<img src="${flower.image_url}" alt="${flower.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%2331572c%22/><text x=%2250%22 y=%2260%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>🌿</text></svg>'">` : 
                        `<div style="height: 180px; background: linear-gradient(135deg, #31572c 0%, #38832f 100%); display: flex; align-items: center; justify-content: center; border-radius: 10px; margin-bottom: 1em;">
                            <span style="color: white; font-size: 2em;">🌿</span>
                        </div>`
                    }
                    <h3>${flower.name}</h3>
                    <p><strong>Тип:</strong> ${flower.type}</p>
                    <p><strong>Дата анализа:</strong> ${new Date(flower.analysis_date).toLocaleDateString('ru-RU')}</p>
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
                <button class="button" onclick="showSection('analyze-plant')">🔍 Проанализировать первый цветок</button>
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
    
    // Создаем тестового пользователя если нет пользователей
    const users = DataStorage.getUsers();
    if (users.length === 0) {
        const testUser = {
            id: "user_1",
            username: "Тестовый пользователь",
            email: "test@example.com",
            password: "12345678",
            created_at: new Date().toISOString(),
            flowers: [],
            analysis_count: 0
        };
        users.push(testUser);
        DataStorage.saveUsers(users);
    }
    
    // Обновляем UI
    updateUI();
});
