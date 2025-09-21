import sqlite3
import os
from datetime import datetime
import json

class LeaderboardDatabase:
    def __init__(self, db_path="backend/leaderboard.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with proper tables"""
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    username TEXT NOT NULL,
                    email TEXT,
                    avatar_url TEXT,
                    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create leaderboard table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS leaderboard (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    points INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    streak INTEGER DEFAULT 0,
                    total_quizzes INTEGER DEFAULT 0,
                    correct_answers INTEGER DEFAULT 0,
                    badges TEXT DEFAULT '[]',
                    weekly_points INTEGER DEFAULT 0,
                    monthly_points INTEGER DEFAULT 0,
                    previous_rank INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # Create activity log table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS activity_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    activity_type TEXT NOT NULL,
                    points_earned INTEGER DEFAULT 0,
                    details TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # Create achievements table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    achievement_name TEXT NOT NULL,
                    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            conn.commit()
            print("✅ Database tables created successfully!")
    
    def add_user(self, user_id, username, email=None, avatar_url=None):
        """Add a new user to the system"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                # Insert user
                cursor.execute('''
                    INSERT OR IGNORE INTO users (user_id, username, email, avatar_url)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, username, email, avatar_url))
                
                # Initialize leaderboard entry
                cursor.execute('''
                    INSERT OR IGNORE INTO leaderboard (user_id)
                    VALUES (?)
                ''', (user_id,))
                
                conn.commit()
                return True
            except sqlite3.Error as e:
                print(f"Error adding user: {e}")
                return False
    
    def update_user_score(self, user_id, points_earned, activity_type="general"):
        """Update user's score and related metrics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                # Update leaderboard
                cursor.execute('''
                    UPDATE leaderboard 
                    SET points = points + ?,
                        weekly_points = weekly_points + ?,
                        monthly_points = monthly_points + ?,
                        level = (points + ?) / 100 + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                ''', (points_earned, points_earned, points_earned, points_earned, user_id))
                
                # Log activity
                cursor.execute('''
                    INSERT INTO activity_log (user_id, activity_type, points_earned)
                    VALUES (?, ?, ?)
                ''', (user_id, activity_type, points_earned))
                
                conn.commit()
                return True
            except sqlite3.Error as e:
                print(f"Error updating score: {e}")
                return False
    
    def update_quiz_stats(self, user_id, quiz_score, max_score=100):
        """Update quiz-related statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            try:
                is_correct = quiz_score >= (max_score * 0.8)  # 80% threshold
                
                cursor.execute('''
                    UPDATE leaderboard 
                    SET total_quizzes = total_quizzes + 1,
                        correct_answers = correct_answers + ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                ''', (1 if is_correct else 0, user_id))
                
                conn.commit()
                return True
            except sqlite3.Error as e:
                print(f"Error updating quiz stats: {e}")
                return False
    
    def get_leaderboard(self, limit=50, time_filter='all', category='points'):
        """Get leaderboard data"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            cursor = conn.cursor()
            
            # Determine sort column
            sort_column = {
                'points': 'l.points',
                'weekly': 'l.weekly_points', 
                'monthly': 'l.monthly_points',
                'quizzes': 'l.total_quizzes',
                'streak': 'l.streak'
            }.get(category, 'l.points')
            
            query = f'''
                SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.avatar_url,
                    u.joined_date,
                    l.points,
                    l.level,
                    l.streak,
                    l.total_quizzes,
                    l.correct_answers,
                    l.badges,
                    l.weekly_points,
                    l.monthly_points,
                    l.previous_rank,
                    CASE 
                        WHEN l.total_quizzes > 0 
                        THEN ROUND((l.correct_answers * 100.0) / l.total_quizzes, 1)
                        ELSE 0
                    END as average_score
                FROM users u
                JOIN leaderboard l ON u.user_id = l.user_id
                ORDER BY {sort_column} DESC
                LIMIT ?
            '''
            
            cursor.execute(query, (limit,))
            results = cursor.fetchall()
            
            # Convert to list of dictionaries and add rank
            leaderboard = []
            for rank, row in enumerate(results, 1):
                user_data = dict(row)
                user_data['rank'] = rank
                
                # Parse badges JSON
                try:
                    user_data['badges'] = json.loads(user_data['badges'] or '[]')
                except:
                    user_data['badges'] = []
                
                leaderboard.append(user_data)
            
            return leaderboard
    
    def get_user_rank(self, user_id, category='points'):
        """Get specific user's rank"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            sort_column = {
                'points': 'points',
                'weekly': 'weekly_points',
                'monthly': 'monthly_points', 
                'quizzes': 'total_quizzes',
                'streak': 'streak'
            }.get(category, 'points')
            
            # Get user's current stats
            cursor.execute(f'''
                SELECT *, 
                    (SELECT COUNT(*) + 1 
                     FROM leaderboard l2 
                     WHERE l2.{sort_column} > l1.{sort_column}) as current_rank,
                    CASE 
                        WHEN total_quizzes > 0 
                        THEN ROUND((correct_answers * 100.0) / total_quizzes, 1)
                        ELSE 0
                    END as average_score
                FROM leaderboard l1
                WHERE user_id = ?
            ''', (user_id,))
            
            result = cursor.fetchone()
            if result:
                user_data = dict(result)
                try:
                    user_data['badges'] = json.loads(user_data['badges'] or '[]')
                except:
                    user_data['badges'] = []
                return user_data
            
            return None
    
    def get_leaderboard_stats(self):
        """Get general leaderboard statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_users,
                    AVG(points) as avg_points,
                    MAX(streak) as max_streak,
                    (SELECT username FROM users u JOIN leaderboard l ON u.user_id = l.user_id 
                     ORDER BY l.streak DESC LIMIT 1) as top_streak_user
                FROM leaderboard
            ''')
            
            result = cursor.fetchone()
            return {
                'total_users': result[0] or 0,
                'average_points': round(result[1] or 0, 1),
                'max_streak': result[2] or 0,
                'top_streak_user': result[3] or 'N/A',
                'most_active_day': 'Monday'  # Can be calculated from activity_log
            }

# Initialize database
if __name__ == "__main__":
    db = LeaderboardDatabase()
    print("Database initialized successfully!")
