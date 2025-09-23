from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, User, UserSession
from datetime import datetime, timedelta

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    
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
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            # Sprawdź czy konto jest zablokowane
            if user.is_account_locked():
                return jsonify({'error': 'Account is temporarily locked. Try again later.'}), 423
            
            # Zarejestruj udane logowanie
            user.record_login()
            
            # Utwórz sesję użytkownika
            session = UserSession(
                user_id=user.id,
                session_token=generate_password_hash(str(user.id) + datetime.utcnow().isoformat())[:64],
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                expires_at=datetime.utcnow() + timedelta(days=7)  # Sesja na 7 dni
            )
            db.session.add(session)
            db.session.commit()
            
            # Utwórz token JWT
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict(),
                'access_token': access_token,
                'session_id': session.id
            }), 200
            
        else:
            # Zarejestruj nieudane logowanie
            if user:
                user.record_failed_login()
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Wylogowuje użytkownika i unieważnia sesję"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if session_id:
            session = UserSession.query.get(session_id)
            if session and session.user_id == int(get_jwt_identity()):
                session.is_active = False
                session.expires_at = datetime.utcnow()
                db.session.commit()
        
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500

@auth.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admins can see all users
    if current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    users = User.query.all()
    return jsonify([user.to_public_dict() for user in users])  # UŻYJ to_public_dict()!

@auth.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'username' in data:
        existing = User.query.filter(
            User.username == data['username'],
            User.id != user_id
        ).first()
        if existing:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    if 'email' in data:
        existing = User.query.filter(
            User.email == data['email'],
            User.id != user_id
        ).first()
        if existing:
            return jsonify({'error': 'Email already taken'}), 400
        user.email = data['email']
    
    if 'role' in data:
        if data['role'] not in ['admin', 'moderator', 'user']:
            return jsonify({'error': 'Invalid role'}), 400
        user.role = data['role']
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(user.to_public_dict())  # UŻYJ to_public_dict()!

@auth.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    if user_id == current_user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = User.query.get_or_404(user_id)

    # Usuń uprawnienia użytkownika
    from .models import Permission
    Permission.query.filter_by(user_id=user_id).delete()
    
    # Usuń sesje użytkownika
    UserSession.query.filter_by(user_id=user_id).delete()

    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

@auth.route('/debug-token', methods=['GET'])
@jwt_required()
def debug_token():
    from flask_jwt_extended import get_jwt
    current_user_id = get_jwt_identity()
    jwt_data = get_jwt()
    
    return jsonify({
        'user_id': current_user_id,
        'user_id_type': type(current_user_id).__name__,
        'jwt_data': jwt_data,
        'message': 'Token debug information'
    })

@auth.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Endpoint do zmiany hasła użytkownika
    """
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
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'Użytkownik nie istnieje'}), 404
        
        success, message = user.change_password(current_password, new_password)
        
        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Wystąpił błąd: {str(e)}'}), 500

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Inicjuje proces resetowania hasła
    """
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if user:
            # Tutaj wyślij email z linkiem do resetowania hasła
            # Na razie zwróć sukces dla bezpieczeństwa
            pass
        
        return jsonify({
            'message': 'If the email exists, a password reset link has been sent'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Resetuje hasło używając tokena
    """
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Tutaj weryfikacja tokena i resetowanie hasła
        # Na razie symulacja
        
        return jsonify({'message': 'Password has been reset successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Pobiera aktywne sesje użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    active_sessions = UserSession.query.filter_by(
        user_id=user.id, 
        is_active=True
    ).filter(UserSession.expires_at > datetime.utcnow()).all()
    
    return jsonify([session.to_dict() for session in active_sessions])

@auth.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    """Unieważnia sesję użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    session = UserSession.query.filter_by(
        id=session_id, 
        user_id=user.id
    ).first_or_404()
    
    session.is_active = False
    session.expires_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Session revoked successfully'})
    
@auth.route('/profiles', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    return jsonify(user.to_dict())
