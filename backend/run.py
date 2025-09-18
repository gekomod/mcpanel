from app import create_app, db
from app.models import User

app = create_app()

@app.cli.command("init-db")
def init_db():
    """Initialize the database."""
    with app.app_context():
        db.create_all()
        
        # Create admin user if it doesn't exist
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@example.com', role='admin')
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created: username=admin, password=admin")
        
        print("Database initialized.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)