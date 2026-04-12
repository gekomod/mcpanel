from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from .models import db, User, UserSession
from datetime import datetime, timedelta

auth = Blueprint('auth', __name__)

def _get_current_user():
    """Helper: pobiera aktualnego użytkownika z JWT (bezpieczna konwersja str->int)"""
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201


@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            if user.is_account_locked():
                return jsonify({'error': 'Account is temporarily locked. Try again later.'}), 423

            user.record_login()

            session = UserSession(
                user_id=user.id,
                session_token=generate_password_hash(str(user.id) + datetime.utcnow().isoformat())[:64],
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.session.add(session)
            db.session.commit()

            # JWT identity ZAWSZE jako string
            access_token = create_access_token(identity=str(user.id))

            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict(),
                'access_token': access_token,
                'session_id': session.id
            }), 200
        else:
            if user:
                user.record_failed_login()
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        current_user_id = int(get_jwt_identity())

        if session_id:
            session = UserSession.query.get(session_id)
            if session and session.user_id == current_user_id:
                session.is_active = False
                session.expires_at = datetime.utcnow()
                db.session.commit()

        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500


@auth.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user = _get_current_user()
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    users = User.query.all()
    return jsonify([u.to_public_dict() for u in users])


@auth.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = _get_current_user()
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'username' in data:
        existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']

    if 'email' in data:
        existing = User.query.filter(User.email == data['email'], User.id != user_id).first()
        if existing:
            return jsonify({'error': 'Email already taken'}), 400
        user.email = data['email']

    if 'role' in data:
        if data['role'] not in ['admin', 'moderator', 'user']:
            return jsonify({'error': 'Invalid role'}), 400
        user.role = data['role']

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    user.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(user.to_public_dict())


@auth.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = _get_current_user()
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    user = User.query.get_or_404(user_id)
    from .models import Permission
    Permission.query.filter_by(user_id=user_id).delete()
    UserSession.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})


@auth.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Brak danych'}), 400

        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not all([current_password, new_password, confirm_password]):
            return jsonify({'success': False, 'message': 'Wszystkie pola są wymagane'}), 400
        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'Nowe hasła nie są identyczne'}), 400
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Hasło musi mieć co najmniej 6 znaków'}), 400

        user = _get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Użytkownik nie istnieje'}), 404

        success, message = user.change_password(current_password, new_password)
        status = 200 if success else 400
        return jsonify({'success': success, 'message': message}), status
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wystąpił błąd: {str(e)}'}), 500


@auth.route('/profiles', methods=['GET'])
@jwt_required()
def get_profile():
    user = _get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@auth.route('/profiles', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user = _get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json() or {}
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'language' in data:
            user.language = data['language']
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']

        user.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth.route('/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    user = _get_current_user()
    active_sessions = UserSession.query.filter_by(
        user_id=user.id, is_active=True
    ).filter(UserSession.expires_at > datetime.utcnow()).all()
    return jsonify([s.to_dict() for s in active_sessions])


@auth.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    user = _get_current_user()
    session = UserSession.query.filter_by(id=session_id, user_id=user.id).first_or_404()
    session.is_active = False
    session.expires_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Session revoked successfully'})


@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        # Zawsze zwróć sukces ze względów bezpieczeństwa (nie zdradzaj czy email istnieje)
        email = data.get('email', '')
        if email:
            user = User.query.filter_by(email=email).first()
            if user:
                # TODO: wysyłanie emaila z linkiem resetowania
                pass
        return jsonify({'message': 'If the email exists, a password reset link has been sent'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth.route('/debug-token', methods=['GET'])
@jwt_required()
def debug_token():
    from flask_jwt_extended import get_jwt
    return jsonify({
        'user_id': get_jwt_identity(),
        'jwt_data': get_jwt()
    })
