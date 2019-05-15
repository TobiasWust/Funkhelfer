const $ = (selector) => document.querySelector(selector);

const openMenu = () => {
  $('.topmenu').classList.add('slide-in');
  $('.menuwrapper').classList.add('fade-in');
  $('.menuwrapper').classList.remove('clicktrough');
}

const closeMenu = () => {
  $('.topmenu').classList.remove('slide-in');
  $('.menuwrapper').classList.remove('fade-in');
  $('.menuwrapper').classList.add('clicktrough');
}

const setItem = (item, state) => {
  const i = item.toLowerCase();
  if (state === false) {
    $(`#${i}menu`).classList.remove('menuactive');
    $(`#${i}label`).style.display = 'none';
    $(`#${i}list`).style.display = 'none';
  }
  else {
    $(`#${i}menu`).classList.add('menuactive');
    $(`#${i}label`).style.display = 'block';
    $(`#${i}list`).style.display = 'block';
  }
  localStorage.setItem(i, state);
  $('.tablegrid').style.display = 'grid';
  $('#impressum').style.display = 'none';
}

$('.menubutton').addEventListener('click', () => openMenu());
$('.menuwrapper').addEventListener('click', () => closeMenu());
document.querySelectorAll('.menutoggle').forEach((e) => e.addEventListener('click', (e) => {
  if (e.currentTarget.classList.contains('menuactive')) setItem(e.currentTarget.innerText, false)
    else setItem(e.currentTarget.innerText, true)
  closeMenu()
}));

$('button').addEventListener('click', () => {
  $('.tablegrid').style.display = 'grid';
  $('#impressum').style.display = 'none';
});

$('#showImpressum').addEventListener('click', () => {
  $('.tablegrid').style.display = 'none';
  $('#impressum').style.display = 'flex';
  closeMenu();
});

setItem('pmr', JSON.parse(localStorage.getItem('pmr')));
setItem('lpd', JSON.parse(localStorage.getItem('lpd')));
setItem('unterkanal', JSON.parse(localStorage.getItem('unterkanal')));
