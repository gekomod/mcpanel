from .models import db, User

def register_commands(app):
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
    
    @app.cli.command("create-user")
    def create_user():
        """Create a new user."""
        import click
        from getpass import getpass
        
        username = click.prompt('Username')
        email = click.prompt('Email')
        password = getpass('Password: ')
        role = click.prompt('Role', default='user')
        
        with app.app_context():
            if User.query.filter_by(username=username).first():
                print(f"User {username} already exists!")
                return
            
            user = User(username=username, email=email, role=role)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            
            print(f"User {username} created successfully!")