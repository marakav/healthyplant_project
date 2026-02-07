from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_from_directory
import os
import json
from datetime import datetime
import secrets
import uuid

app = Flask(__name__)
app.secret_key = 'flower-care-secret-key-2024'

# Файлы данных
USERS_FILE = 'users.json'
TOKENS_FILE = 'tokens.json'
ANALYSIS_FILE = 'analysis.json'


def init_files():
    """Инициализация файлов данных"""
    for file in [USERS_FILE, TOKENS_FILE, ANALYSIS_FILE]:
        if not os.path.exists(file):
            with open(file, 'w') as f:
                json.dump([], f)


def read_json_file(filename):
    """Чтение данных из JSON файла"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except:
        return []


def save_json_file(filename, data):
    """Сохранение данных в JSON файл"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_token():
    """Генерация уникального токена"""
    return secrets.token_hex(16)


def save_user(username, email, password):
    """Сохранение нового пользователя"""
    users = read_json_file(USERS_FILE)

    if any(user['email'] == email for user in users):
        return False, 'Пользователь с таким email уже существует'

    user_id = str(uuid.uuid4())
    new_user = {
        'id': user_id,
        'username': username,
        'email': email,
        'password': password,
        'created_at': datetime.now().isoformat(),
        'flowers': [],
        'analysis_count': 0
    }

    users.append(new_user)
    save_json_file(USERS_FILE, users)
    return True, 'Регистрация успешна'


def authenticate_user(email, password):
    """Аутентификация пользователя"""
    users = read_json_file(USERS_FILE)
    for user in users:
        if user['email'] == email and user['password'] == password:
            return user
    return None


def get_user_data(user_id):
    """Получение данных пользователя"""
    users = read_json_file(USERS_FILE)
    for user in users:
        if user['id'] == user_id:
            return user
    return None


def get_user_flowers(user_id):
    """Получение всех растений пользователя"""
    user = get_user_data(user_id)
    if user and 'flowers' in user:
        return user['flowers']
    return []


def generate_user_token(user_id):
    """Генерация токена для пользователя"""
    tokens = read_json_file(TOKENS_FILE)

    # Проверяем, есть ли активный токен у пользователя
    for token_data in tokens:
        if token_data['user_id'] == user_id and token_data.get('status') == 'active':
            return token_data['token']

    # Если нет активного токена, создаем новый
    token = generate_token()
    token_data = {
        'user_id': user_id,
        'token': token,
        'created_at': datetime.now().isoformat(),
        'status': 'active'
    }

    tokens.append(token_data)
    save_json_file(TOKENS_FILE, tokens)

    return token


def get_token_info(token):
    """Получение информации о токене"""
    tokens = read_json_file(TOKENS_FILE)
    for t in tokens:
        if t['token'] == token:
            return t
    return None


def check_token_valid(token):
    """Проверка валидности токена"""
    token_info = get_token_info(token)
    if not token_info:
        return False, "Токен не найден"

    if token_info.get('status') != 'active':
        return False, "Токен уже использован"

    return True, "Токен действителен"


def save_analysis_from_bot(token, analysis_data):
    """Сохранение анализа от бота"""
    # Проверяем токен
    token_info = get_token_info(token)
    if not token_info:
        return False, "Токен не найден"

    if token_info.get('status') != 'active':
        return False, "Токен уже использован или неактивен"

    # Сохраняем анализ
    analyses = read_json_file(ANALYSIS_FILE)

    analysis_record = {
        'id': str(uuid.uuid4()),
        'user_id': token_info['user_id'],
        'token': token,
        'plant_name': analysis_data.get('plant_name', 'Неизвестное растение'),
        'plant_type': analysis_data.get('plant_type', 'Неизвестный тип'),
        'description': analysis_data.get('description', ''),
        'watering': analysis_data.get('watering', '1 раз в неделю'),
        'light': analysis_data.get('light', 'Яркий рассеянный свет'),
        'temperature': analysis_data.get('temperature', '20-25°C'),
        'humidity': analysis_data.get('humidity', 'Средняя'),
        'fertilizer': analysis_data.get('fertilizer', 'Раз в 2 недели'),
        'problems': analysis_data.get('problems', []),
        'health_status': analysis_data.get('health_status', 'good'),
        'diseases': analysis_data.get('diseases', []),
        'treatment': analysis_data.get('treatment', ''),
        'image_url': analysis_data.get('image_url', ''),
        'confidence': analysis_data.get('confidence', 0.0),
        'created_at': datetime.now().isoformat(),
        'status': 'completed'
    }

    analyses.append(analysis_record)
    save_json_file(ANALYSIS_FILE, analyses)

    # Отмечаем токен как использованный
    tokens = read_json_file(TOKENS_FILE)
    for t in tokens:
        if t['token'] == token:
            t['status'] = 'used'
            t['used_at'] = datetime.now().isoformat()
            break
    save_json_file(TOKENS_FILE, tokens)

    return True, "Анализ сохранен успешно"


def get_analysis_by_token(token):
    """Получение анализа по токену"""
    analyses = read_json_file(ANALYSIS_FILE)
    for analysis in analyses:
        if analysis['token'] == token:
            return analysis
    return None


def link_analysis_to_user(user_id, token):
    """Связывание анализа с пользователем"""
    analysis = get_analysis_by_token(token)
    if not analysis:
        return False, "Анализ не найден"

    # Добавляем анализ в профиль пользователя
    users = read_json_file(USERS_FILE)
    flower_added = False

    for user in users:
        if user['id'] == user_id:
            if 'flowers' not in user:
                user['flowers'] = []

            flower_record = {
                'id': str(uuid.uuid4()),
                'name': analysis['plant_name'],
                'type': analysis['plant_type'],
                'description': analysis['description'],
                'watering': analysis['watering'],
                'light': analysis['light'],
                'temperature': analysis['temperature'],
                'humidity': analysis['humidity'],
                'fertilizer': analysis['fertilizer'],
                'problems': analysis['problems'],
                'health_status': analysis['health_status'],
                'diseases': analysis['diseases'],
                'treatment': analysis['treatment'],
                'image_url': analysis['image_url'],
                'analysis_date': analysis['created_at'],
                'added_date': datetime.now().isoformat()
            }

            user['flowers'].append(flower_record)
            user['analysis_count'] = len(user['flowers'])
            flower_added = True
            break

    if flower_added:
        save_json_file(USERS_FILE, users)
        return True, "Анализ добавлен в ваш профиль"

    return False, "Ошибка при добавлении анализа"


@app.route("/", methods=['GET', 'POST'])
def index():
    user_data = None
    if 'user_id' in session:
        user_data = get_user_data(session['user_id'])
    return render_template('index.html', user_data=user_data)


@app.route("/my-account")
def my_account():
    if 'user_id' not in session:
        flash('Пожалуйста, войдите в систему.', 'error')
        return redirect(url_for('index'))

    user_data = get_user_data(session['user_id'])
    if not user_data:
        flash('Пользователь не найден.', 'error')
        return redirect(url_for('index'))

    user_flowers = get_user_flowers(session['user_id'])

    return render_template('index.html',
                           user_data=user_data,
                           user_flowers=user_flowers)


@app.route("/generate-token")
def generate_token_route():
    if 'user_id' not in session:
        flash('Пожалуйста, войдите в систему.', 'error')
        return redirect(url_for('index'))

    token = generate_user_token(session['user_id'])
    flash(f'Ваш токен: {token}. Скопируйте его и отправьте боту в Telegram.', 'success')
    return redirect(url_for('my_account'))


@app.route("/submit-token", methods=['POST'])
def submit_token():
    if 'user_id' not in session:
        flash('Пожалуйста, войдите в систему.', 'error')
        return redirect(url_for('index'))

    token = request.form.get('token')
    if not token:
        flash('Введите токен', 'error')
        return redirect(url_for('my_account'))

    # Проверяем валидность токена
    is_valid, message = check_token_valid(token)
    if not is_valid:
        flash(f'Ошибка: {message}', 'error')
        return redirect(url_for('my_account'))

    # Проверяем, принадлежит ли токен пользователю
    token_info = get_token_info(token)
    if token_info['user_id'] != session['user_id']:
        flash('Этот токен принадлежит другому пользователю', 'error')
        return redirect(url_for('my_account'))

    success, message = link_analysis_to_user(session['user_id'], token)

    if success:
        flash(message, 'success')
    else:
        flash(message, 'error')

    return redirect(url_for('my_account'))


# API для Telegram бота
@app.route("/api/save-analysis", methods=['POST'])
def api_save_analysis():
    """API endpoint для сохранения анализа от Telegram бота"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        token = data.get('token')
        if not token:
            return jsonify({'success': False, 'error': 'Token required'}), 400

        success, message = save_analysis_from_bot(token, data)

        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'error': message}), 400

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route("/register", methods=['POST'])
def register():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')

    if not request.form.get('privacy_policy'):
        flash('Необходимо согласиться с обработкой персональных данных', 'error')
        return redirect(url_for('index'))

    if not all([username, email, password, confirm_password]):
        flash('Все поля обязательны для заполнения!', 'error')
        return redirect(url_for('index'))

    if password != confirm_password:
        flash('Пароли не совпадают!', 'error')
        return redirect(url_for('index'))

    success, message = save_user(username, email, password)

    if success:
        flash(message, 'success')
        user = authenticate_user(email, password)
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['email'] = user['email']
            flash(f'Добро пожаловать, {user["username"]}!', 'success')
    else:
        flash(message, 'error')

    return redirect(url_for('index'))


@app.route("/login", methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    if not all([email, password]):
        flash('Все поля обязательны для заполнения!', 'error')
        return redirect(url_for('index'))

    user = authenticate_user(email, password)

    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']
        flash(f'Добро пожаловать, {user["username"]}!', 'success')
    else:
        flash('Неверный email или пароль!', 'error')

    return redirect(url_for('index'))


@app.route("/logout")
def logout():
    session.clear()
    flash('Вы успешно вышли из системы!', 'info')
    return redirect(url_for('index'))


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


if __name__ == "__main__":
    init_files()
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )