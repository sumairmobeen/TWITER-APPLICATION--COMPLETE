

var url = "https://my-chat1.herokuapp.com";
// var url = "http://localhost:5000";
var socket = io(url);

socket.on('connect', function () {
    console.log("connected")
});

function signup() {

    axios({
        method: 'post',
        url: url + '/signup',
        data: {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            phone: document.getElementById("number").value,
            gender: document.getElementById("gender").value
        }, withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            alert(response.data.message)
            location.href = "./../login.html"
        } else {
            alert(response.data.message);
        }
    }).catch((error) => {
        console.log(error);
    });

    return false;
}

function login() {
    axios({
        method: 'post',
        url: url + "/login",
        data: {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../tweet.html"
            
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });

    return false;
}



function getProfile() {
    axios({
        method: 'get',
        url: url + '/profile',
        credentials: 'include',
    }).then((response) => {
        console.log(response);
        document.getElementById('name').innerHTML = response.data.profile.name
        document.getElementById('email').innerHTML = response.data.profile.email
        document.getElementById("show_pic").src = response.data.profile.profilePic
        sessionStorage.setItem('email', response.data.profile.email)
    }, (error) => {
        console.log(error.message);
    });
    return false
}



function upload() {

    var fileInput = document.getElementById("fileInput");

    console.log("fileInput: ", fileInput);
    console.log("fileInput: ", fileInput.files[0]);

    let formData = new FormData();

    formData.append("myFile", fileInput.files[0]); 
    formData.append("email", sessionStorage.getItem("email")); 

    axios({
        method: 'post',
        url: url + "/upload",
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    })
        .then(res => {
            console.log(`  upload Success`);
            alert("upload Success")
            // document.getElementById("show_pic").innerHTML = instanceOfFileReader.readAsDataURL(res.data);
        })
        .catch(err => {
            console.log(err);
        })

    return false; // dont get confused with return false, it is there to prevent html page to reload/default behaviour, and this have nothing to do with actual file upload process but if you remove it page will reload on submit -->

}

function forget() {
    axios({
        method: 'post',
        url: url + "/forget-password",
        data: {
            email: document.getElementById("email").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../forget-two.html"
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });

    return false;

}
function ChangePassowd() {
    axios({
        method: 'post',
        url: url + "/forget-password-step2",
        data: {
            email: document.getElementById("email").value,
            otp: document.getElementById("otp").value,
            newPassword: document.getElementById("password").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "./../login.html"
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });
    return false;

}


function tweetpost() {
    axios({
        method: 'post',
        url: url + "/tweet",
        data: {
            tweet: document.getElementById("tweet").value,
        },
        withCredentials: true
    }).then((response) => {
        if (response.data.status === 200) {
            // alert(response.data.message)
            return
        } else {
            alert(response.data.message)
        }
    }, (error) => {
        console.log(error);
    });
}


function gettweet() {
    getProfile();
    axios({
        method: 'get',
        url: url + '/tweet-get',
        credentials: 'include',
    }).then((response) => {
        let tweets = response.data.gettweet;
        for (i = 0; i < tweets.length; i++) {
            var eachtweet = document.createElement("li");
            eachtweet.innerHTML = `
            <img src="${tweets[i].profilePic}" width="50" height="50 " style="border-radius: 100%"/>
            <h4>
                ${tweets[i].username}
                </h4>
                 <p>
                    ${tweets[i].tweet}
                </p>`;
            document.getElementById("mytweet").appendChild(eachtweet);
        }
    }, (error) => {
        console.log(error.message);
    });


    return false
}

function mytweet() {
    axios({
        method: 'get',
        url: url + '/myTweets',
        credentials: 'include',
    }).then((response) => {
        let tweets = response.data.tweet;
        for (i = 0; i < tweets.length; i++) {
            var eachtweet = document.createElement("li");
            eachtweet.innerHTML = `
            <img src="${tweets[i].profilePic}" width="50" height="50 " style="border-radius: 100%"/>
            
            <h4>
                ${tweets[i].username}
                </h4>
                 <p>
                    ${tweets[i].tweet}
                </p>`;
            document.getElementById("getalltweet").appendChild(eachtweet);
        }
    }, (error) => {
        console.log(error.message);
    });
    return false
}

socket.on("NEW_POST", (newPost) => {
    console.log(newPost);
    let jsonRes = newPost;
    var eachtweet = document.createElement("li");
    eachtweet.innerHTML = `
    <img src="${jsonRes.profilePic}" width="50" height="50 " style="border-radius: 100%"/>  
    <h4>
    ${jsonRes.username}
    </h4>
     <p>
        ${jsonRes.tweet}
    </p>`;

    document.getElementById("getalltweet").appendChild(eachtweet);


})

socket.on("MY_POST", (newPost) => {

    console.log("second socket chnage",newPost)
    console.log(newPost);

    let jsonRes = newPost;
    var eachtweet = document.createElement("li");
    eachtweet.innerHTML = `
    <img src="${jsonRes.profilePic}" width="50" height="50 " style="border-radius: 100%"/>
    <h4>
    ${jsonRes.username}
    </h4>
     <p>
        ${jsonRes.tweet}
    </p>`;

    document.getElementById("getalltweet").appendChild(eachtweet);
    

})


function previewFile() {
    const preview = document.querySelector('img');
    const file = document.querySelector('input[type=file]').files[0];
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        // convert image file to base64 string
        preview.src = reader.result;
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}   

function logout() {
    axios({
        method: 'post',
        url: url + '/logout',
        credentials: 'include',
    }).then((response) => {
        console.log(response);
        window.location.href = "./../login.html"
    }, (error) => {
        console.log(error.message);
    });
    return false
}


function showProfile() {
    document.getElementById('other').style.display = "none"
    document.getElementById('profile').style.display = "block"
}



