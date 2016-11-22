define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var car1 = new Image();
  car1.src = "./assets/images/car1.png";

  var car2 = new Image();
  car2.src = "./assets/images/car2.png";

  var car3 = new Image();
  car3.src = "./assets/images/car3.png";

  var car4 = new Image();
  car4.src = "./assets/images/car4.png";
  
  var car5 = new Image();
  car5.src = "./assets/images/car5.png";

  var car6 = new Image();
  car6.src = "./assets/images/car6.png";

  var car7 = new Image();
  car7.src = "./assets/images/car7.png";

  var car8 = new Image();
  car8.src = "./assets/images/car8.png";

  var map1 = new Image();
  map1.src = "./assets/images/map1.png";

  return {
    car1: car1,
    car2: car2,
    car3: car3,
    car4: car4,
    car5: car5,
    car6: car6,
    car7: car7,
    car8: car8,
    map1: map1,
  }
})