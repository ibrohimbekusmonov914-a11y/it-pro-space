let coinCount = 0;

function coin(){
    document.querySelector("nav").style.display = "none";
    document.querySelector(".coin-page").style.display = "flex";
}

function goBack(){
    document.querySelector("nav").style.display = ""; // ← "flex" o'rniga bo'sh qator
    document.querySelector(".coin-page").style.display = "none";
}