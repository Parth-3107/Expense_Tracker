import os 
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DATABASE = os.path.join(os.path.abspath(os.path.dirname('Personal Expense Tracker')),'instance','expenses.db')

    class DevelopmentConfig(Config):
        DEBUG = True
        TESTING = False
    class ProductionConfig(Config):
        DEBUG = False
        TESTING = False
        SECRET_KEY = os.environ.get('SECRET_KEY')

    config = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'default' : DevelopmentConfig
    }
    