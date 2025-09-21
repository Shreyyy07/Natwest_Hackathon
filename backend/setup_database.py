"""
Database Setup Script for Tayyari.ai Leaderboard
Run this once to initialize your database with sample data
"""

import sys
import os

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Now import the database class
from database.leaderboard_db import LeaderboardDatabase
import random
from datetime import datetime

def setup_initial_data():
    """Set up the database with sample users and data"""
    
    print("🚀 Starting Tayyari.ai Database Setup...")
    
    # Initialize database
    try:
        db = LeaderboardDatabase()
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    
    # Sample users data
    sample_users = [
        {
            "user_id": "user_alex_001", 
            "username": "Alex Johnson", 
            "email": "alex.johnson@example.com",
            "activities": 20,
            "base_points": 2450
        },
        {
            "user_id": "user_sarah_002", 
            "username": "Sarah Chen", 
            "email": "sarah.chen@example.com",
            "activities": 18,
            "base_points": 2120
        },
        {
            "user_id": "user_mike_003", 
            "username": "Mike Rodriguez", 
            "email": "mike.rodriguez@example.com",
            "activities": 15,
            "base_points": 1890
        },
        {
            "user_id": "user_emma_004", 
            "username": "Emma Wilson", 
            "email": "emma.wilson@example.com",
            "activities": 12,
            "base_points": 1650
        },
        {
            "user_id": "user_david_005", 
            "username": "David Kim", 
            "email": "david.kim@example.com",
            "activities": 10,
            "base_points": 1420
        }
    ]
    
    print(f"📊 Creating {len(sample_users)} sample users...")
    
    # Add users and simulate their activities
    for i, user in enumerate(sample_users, 1):
        try:
            print(f"  {i}. Adding {user['username']}...")
            
            # Add user to database
            success = db.add_user(
                user["user_id"], 
                user["username"], 
                user["email"]
            )
            
            if success:
                # Simulate user activities
                total_points = 0
                
                for j in range(user["activities"]):
                    # Mix of different activities
                    if j % 3 == 0:  # Quiz
                        quiz_score = random.randint(70, 100)
                        points = 15 if quiz_score < 80 else (25 if quiz_score < 90 else 35)
                        db.update_user_score(user["user_id"], points, "quiz_completed")
                        db.update_quiz_stats(user["user_id"], quiz_score)
                        total_points += points
                    else:  # Content processing
                        points = random.randint(15, 30)
                        activity = random.choice(["pdf_processed", "text_processed", "url_processed"])
                        db.update_user_score(user["user_id"], points, activity)
                        total_points += points
                
                print(f"    ✅ {user['username']}: {total_points} points, {user['activities']} activities")
                
            else:
                print(f"    ❌ Failed to add {user['username']}")
                
        except Exception as e:
            print(f"    ❌ Error adding {user['username']}: {e}")
    
    print("\n🎯 Database setup completed!")
    
    # Display summary
    try:
        stats = db.get_leaderboard_stats()
        leaderboard = db.get_leaderboard(limit=5)
        
        print("\n📈 Database Summary:")
        print(f"   Total Users: {stats['total_users']}")
        print(f"   Average Points: {stats['average_points']}")
        print(f"   Top Streak User: {stats['top_streak_user']}")
        
        print("\n🏆 Top 5 Leaderboard:")
        for user in leaderboard:
            print(f"   {user['rank']}. {user['username']} - {user['points']} points")
            
    except Exception as e:
        print(f"❌ Error displaying summary: {e}")
    
    print("\n✅ Setup completed successfully!")
    print("💡 You can now start your Flask server and test the leaderboard!")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("    🎓 TAYYARI.AI DATABASE SETUP")
    print("=" * 60)
    
    # Run setup
    success = setup_initial_data()
    
    if success:
        print("\n🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("   1. Start your Flask server: python app.py")
        print("   2. Visit your leaderboard page to see the data")
        print("   3. Test content processing to earn points")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
    
    print("\n" + "=" * 60)
