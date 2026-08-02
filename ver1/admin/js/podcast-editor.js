
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
// SAVE BUTTON TEMP
// =====================


const saveButton =

document.getElementById(
"savePodcast"
);



if(saveButton){


saveButton.addEventListener(
"click",
function(){



const podcast = {


title:

document.getElementById(
"podcastTitle"
).value,



episode:

document.getElementById(
"episodeNumber"
).value,



status:

document.getElementById(
"status"
).value,



book:

document.getElementById(
"bookSelect"
).value,



summary:

document.getElementById(
"summary"
).value,



transcript:

document.getElementById(
"transcript"
).value,



tags:

document.getElementById(
"tags"
).value



};




console.log(
"Podcast Data:",
podcast
);




NightCastUI.success(

"اطلاعات پادکست آماده ذخیره است"

);



});


}




});
