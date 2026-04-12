from app import create_app, db
from app.models import User
import os

app = create_app()


@app.cli.command("init-db")
def init_db():
    """Initialize the database and create default admin user."""
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@example.com', role='admin')
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created: username=admin, password=admin")
            print("⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY!")
        else:
            print("ℹ️  Admin user already exists.")

        print("✅ Database initialized.")


@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User}


if __name__ == '__main__':
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=debug, host='0.0.0.0', port=port, threaded=True)
