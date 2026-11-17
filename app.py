import os
import click
import psycopg2
from flask import Flask, render_template, request, url_for, redirect, session
from getpass import getpass
from set_up_database import * 


app = Flask(__name__)

class Request: 
    def __init__(self, type):
        self.type = type 

class Post: 
    def __init__(self, user, name, overview, imgs, description, instructions):
        self.name = name
        self.user = user 
        self.overview = overview
        self.images = imgs 
        self.descr = description
        self.instructs = instructions

    def thumbnail(self):
        return (self.name, self.user, self.images[0], self.overview)




class SignIn(Request):
    def __init__(self, type, email, pw):
        super().__init__(type)
        self.email = email 
        self.pw = pw 

class CreateAccount(Request):
    def __init__(self, type, email, name, pw, coc):
        super().__init__(type)
        self.email = email 
        self.name = name 
        self.pw = pw 
        self.coc = coc 
    

def Submit(req: Request):
    if req.type == 1:
        print(f"Sign in: {req.email} | {req.pw}") 
    if req.type == 2:
        print(f"Create: {req.email} | {req.name} | {req.pw} | {req.coc}")

def get_db_connection():
    conn = psycopg2.connect(
        host='localhost', 
        database=os.environ['DB'],
        user=os.environ['DB_UN'], 
        password=os.environ['DB_PW'])
    return conn



def validate(username: str, password:str):
    conn = get_db_connection()
    cur = conn.cursor() 
    cur.execute(f"SELECT user_id FROM verify WHERE password = '{password}' AND username = '{username}'")
    data = cur.fetchall() 
    #print(data)
    if  len(data) == 0:
        cur.close()
        conn.close() 
        return False 
    else: 
        session['user_id'] = data[0]
        cur.close()
        conn.close()
        return True

@app.cli.command("initalize-postgres-db")
@click.argument("db_name")
def init_db(db_name):
    create_db(os.environ['postgres-user'], os.environ['postgres-password'], db_name=db_name)
    create_table(os.environ['postgres-user'], os.environ['postgres-password'], db_name=db_name)

def strip_string(st):
    st = str(st)
    st = st.strip() 
    st.replace("'", "")
    st.replace("{", "")
    st.replace("}", "")
    return st 

@app.route('/')
def index():
    try:
        if session['user_id'] != None: 
            return render_template("explore.html")
    except KeyError:
            return redirect('/home/')


@app.route('/signup/', methods=['POST', 'GET'])
def signup():
    if request.method == 'POST':
        email = request.form['email'] 
        email = strip_string(email) 
        name = request.form['name']
        name = strip_string(name)
        pw = request.form['password']
        pw = strip_string(pw)
        coc = request.form['coc']
        coc = strip_string(pw)
        if Submit(CreateAccount(2, email, name, pw, coc)):
            redirect('/signin/')
        else:
            return render_template('signup.html', help='Invalid Account Creation')
    return render_template('signup.html')

@app.route('/signin/', methods=['POST', 'GET'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        email = strip_string(email)
        pw = request.form['password']
        pw = strip_string(pw)
        if Submit(SignIn(1, email, pw)):
            if session['user_id'] != None: 
                redirect('/home/')
        else:
            return render_template('signin.html', help='Invalid Sign In')
    return render_template('signin.html')

@app.route('/home/', methods=['POST', 'GET'])
def home(): 
    return render_template('explore.html')

@app.route('/profile/', methods=['POST', 'GET'])
def profile(): 
    return render_template('profile.html')

@app.route('/settings/', methods=['POST', 'GET'])
def settings(): 
    return render_template('settings.html')

@app.route('/create/', methods=['POST', 'GET'])
def create(): 
    return render_template('settings.html')

@app.route('/home/button_process/<int:id>')
def home_button(id=None):
    print(f"Home: Button ID: {id}") 
    return "nothing"

@app.route('/profile/button_process/<int:id>')
def profile_button(id=None):
    print(f"Profile: Button ID: {id}") 
    return "nothing"













#TO DO: 
# 1. change button process to forbidden 
# 2. link all buttons in all pages 
















# @app.route('/create/', methods=('GET', 'POST'))
# def create():
#     if request.method == 'POST':
#         title = request.form['title']
#         author = request.form['author']
#         pages_num = int(request.form['pages_num'])
#         review = request.form['review']

#         conn = get_db_connection()
#         cur = conn.cursor()
#         cur.execute('INSERT INTO book_reviews (title, author, pages_num, review)'
#                     'VALUES (%s, %s, %s, %s)',
#                     (title, author, pages_num, review))
#         conn.commit()
#         cur.close()
#         conn.close()
#         return redirect(url_for('index'))

#     return render_template('create.html')

# @app.route('/delete/<int:id>/')
# def delete(id):
#     #Your code here - what should happen when a user clicks "Delete Review" on a particular review (with the specified id)? 
    

#     #Note - no need to change the code below - this will redirect the user back to the reviews page once they've deleted a review.
#     return redirect(url_for('index'))

# @app.route('/edit/<int:id>', methods = ('GET', 'POST'))
# def edit(id):
#     #GET:
#     if request.method == 'GET':
#         #Your code here - what should happen when a user clicks "Edit Review" on a particular review (with the specified id)?

#         #Note - you will need to change the render_template code segment below to pass in information to the edit.html template (once you have modified edit.html).
#         return render_template('edit.html')
    
#     #POST:
#     elif request.method == 'POST':
#         #Your code here - what should happen when the user submits their edited review (for the review with the given id)?


#         #Note - no need to change the code below - this will redirect the user back to the reviews page once they've submitted their edited review. 
#         return redirect(url_for('index'))


# x = input("Username: ")
# y = input("Password: ")
# print(validate(x, y))

if __name__ == '__main__':
    app.run(debug=True)
