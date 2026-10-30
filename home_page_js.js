

function get_submit() {
    let un = document.getElementById("username"); 
    let pw = document.getElementById("password"); 

    let usr = un.value; 
    let psw = pw.value; 

    psw = psw.toLowerCase(); 

    un.value = ""; 
    pw.value = ""; 

    if (usr == "" && psw == ""){

    } else {

        if (usr == "Micah Chen" && psw == "indubitably"){
            alert("Working"); 
        } else {
            alert("Invalid credintials");
        }
    }
}