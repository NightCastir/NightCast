
/* =====================
   NIGHTCAST PODCAST EDITOR
===================== */


document.addEventListener(
"DOMContentLoaded",
async function(){



// =====================
// CHECK AUTH
// =====================


const admin =

await NightCastAuth.check();



if(!admin){

return;

}

// =====================
// LOAD BOOKS
// =====================

async function loadBooks(){


const token =

sessionStorage.getItem(
"NightCastSession"
);



try{


const response =

await fetch(

API + "/api/books",

{

method:"GET",

headers:{

"Authorization":

"Bearer " + token

}

}

);



const data =

await response.json();





const select =

document.getElementById(
"bookSelect"
);




select.innerHTML = "";





if(data.success && data.books.length > 0){



data.books.forEach(

book=>{


const option =

document.createElement(
"option"
);



option.value =
book.id;



option.textContent =
book.title;



select.appendChild(
option
);



}

);



}

else{


select.innerHTML = `

<option>

کتابی وجود ندارد

</option>

`;


}




}

catch(error){


console.error(
"LOAD BOOKS ERROR:",
error
);


document.getElementById(
"bookSelect"
).innerHTML = `

<option>

خطا در دریافت کتاب‌ها

</option>

`;

}


}



await loadBooks();



// =====================
// AUDIO PREVIEW
// =====================


const audioInput =

document.getElementById(
"audioFile"
);



const audioPreview =

document.getElementById(
"audioPreview"
);




if(audioInput){



audioInput.addEventListener(
"change",
function(){



const file =

this.files[0];




if(!file){

return;

}




const url =

URL.createObjectURL(file);





audioPreview.innerHTML = `


<audio controls>

<source src="${url}" type="audio/mpeg">

مرورگر شما پشتیبانی نمی‌کند.

</audio>


<p>

${file.name}

</p>


`;



}


);


}






// =====================
// COVER PREVIEW
// =====================


const coverInput =

document.getElementById(
"coverFile"
);



const coverImage =

document.getElementById(
"coverPreview"
);



const coverEmpty =

document.getElementById(
"coverEmpty"
);




if(coverInput){



coverInput.addEventListener(
"change",
function(){



const file =

this.files[0];




if(!file){

return;

}




const url =

URL.createObjectURL(file);




coverImage.src = url;


coverImage.style.display="block";


coverEmpty.style.display="none";



}


);


}





// =====================
// SAVE PODCAST
// =====================


const saveButton =

document.getElementById(
"savePodcast"
);



if(saveButton){


saveButton.addEventListener(
"click",
async function(){



const token =

sessionStorage.getItem(
"NightCastSession"
);



if(!token){


window.location.href="login.html";

return;


}




const podcast = {



book_id:

document.getElementById(
"bookSelect"
).value || null,



title:

document.getElementById(
"podcastTitle"
).value.trim(),



episode_number:

document.getElementById(
"episodeNumber"
).value || 1,



summary:

document.getElementById(
"summary"
).value,



transcript:

document.getElementById(
"transcript"
).value,



status:

document.getElementById(
"status"
).value,



publish_date:

document.getElementById(
"publishDate"
).value || null



};






if(!podcast.title){


NightCastUI.error(

"عنوان پادکست را وارد کنید"

);


return;


}




try{



const response =

await fetch(

API + "/api/podcasts",

{

method:"POST",


headers:{


"Content-Type":
"application/json",


"Authorization":

"Bearer " + token


},



body:

JSON.stringify(podcast)



}

);





const data =

await response.json();





console.log(
"CREATE PODCAST:",
data
);






if(data.success){



NightCastUI.success(

"پادکست با موفقیت ثبت شد"

);



}

else{


NightCastUI.error(

data.message ||

"خطا در ثبت پادکست"

);


}





}

catch(error){



console.error(error);



NightCastUI.error(

"خطا در ارتباط با سرور"

);



}



});


}

});
