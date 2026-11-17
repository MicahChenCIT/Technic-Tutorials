import psycopg2
from psycopg2 import sql 
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_db(usr, pwd, db_name):
    con = psycopg2.connect(dbname='postgres', user=usr, password=pwd)
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()
    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))) #Shamelessly copied from 'Tom-db' on StackOverflows

# SELECT * WHERE username = John Steele AND password = 1234 

# def duff():
#     con = psycopg2.connect(dbname='technicaltest', user='postgres', password='COder1253!')
#     cur = con.cursor()
#     commands = [
#         """
        
#         """
#     ]
#     for command in commands: 
#         cur.execute(command)
#     cur.close()
#     con.close()

# duff()

#Default auto execute function to set up our application when deploying
def create_table(usr, pwd, db_name):
    con = psycopg2.connect(dbname=db_name, user=usr, password=pwd)
    #con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()
    commands = [
        """
        CREATE TABLE verify (
            username text NOT NULL, 
            password text NOT NULL,
            user_id text NOT NULL
        )
        """,
        """
        CREATE TABLE user (
            user_id text PRIMARY KEY, 
            user_name text NOT NULL,
            user_email text NOT NULL,
            profile_pic text NOT NULL,
        )
        """, 
        """
        CREATE TABLE posts (
            name text NOT NULL, 
            user_id text NOT NULL, 
            img_codes text NOT NULL,
            upvotes integer NOT NULL,
            review_codes text NOT NULL, 
            reviews integet NOT NULL, 
        )
        """,
        """
        CREATE TABLE images (
            img_code text PRIMARY KEY,
            img text NOT NULL
        )
        """,
        """
        CREATE TABLE reviews (
            review_code text PRIMARY KEY,
            review text NOT NULL
        )
        """
    ]
    for command in commands:
        cur.execute(command)
    cur.close()
    con.close()
