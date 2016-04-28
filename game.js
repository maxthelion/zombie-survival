var playerSprite = {
  coords: {
    x: 250,
    y: 250
  }
}
var sprites = {
  players: [],
  loot: []
}

var player = {
  timeRemaining: 0,
  timeElapsed: 0
}
var chunks = [
  []
]
var ctx
var playerSpriteImg
var dispatcher = []
var fullHealth = 1000
var viewPort = {
  width: 700,
  height: 700,
  offsetX: 0,
  offsetY: 0,
  scale: 1
}

var miniViewPort = {
  width: 200,
  height: 200,
  offsetX: 0,
  offsetY: 0,
  scale: 0.1
}
var gameInterval
$().ready(function(){
  //initialize stuff
  ctx = document.getElementById('canvas').getContext('2d');
  minictx = document.getElementById('minimap').getContext('2d');
  playerSpriteImg = new Image();
  playerSpriteImg.onload = function(){
    imagesReady = true
  };
  playerSpriteImg.src = 'images/player-sprite.png';
  medPakImg = new Image();
  medPakImg.onload = function(){
    imagesReady = true
  };
  medPakImg.src = 'images/medpak.png';
  $(document).keydown( handleKeys )
  
  startGame()
})

function startGame(){
  addWelcomeMsg()
  addLootSprites()
  player.timeRemaining = 1000
  gameInterval = setInterval(gameTick, 50)
  tick = 0
  $('#welcomeScreen').css("opacity", 1)
}

function endGame(){
  var deathScreen = $("<div id=\"deathScreen\"><h2> You turned into a zombie!</h2></div>")
  deathScreen.append("<p>You survived for a duration of " + player.timeElapsed + "</p>" )
  var startButton = $("<a id=\"startBtn\" href=\"#\">Start again!</a>")
  startButton.click(function(){
    $("#deathScreen").remove();
    startGame()
  })
  deathScreen.append(startButton)
  $("body").append(deathScreen)
  clearInterval(gameInterval)
}

function addWelcomeMsg(){
  var welcomeScren = $("<div id=\"welcomeScreen\"><h2>You've been bitten by a zombie!</h2></div>")
  welcomeScren.append("<p>Your only hope is to collect and use the vaccines (<img src=\"images/medpak.png\">) that have been airdropped into this area. They have a very temporary effect though!</p>" )
  welcomeScren.append("<p>Use the arrow keys to move, and consult the map on the right for the locations of the medpaks.</p>" )
  welcomeScren.append("<p><strong>We hope you don't run <i>OUT OF TIME!!!</i></strong></p>" )
  $("body").append(welcomeScren)
}

var moveKeys = {}
function handleKeys(event){
  if ( event.which == 37 ) {
    moveKeys.left = true
    event.preventDefault();
  } 
  if ( event.which == 39 ) {
    moveKeys.right = true
    event.preventDefault();
  } 
  if ( event.which == 38 ) {
    moveKeys.up = true
    event.preventDefault();
  } 
  if ( event.which == 40 ) {
    moveKeys.down = true
    event.preventDefault();
  }
}

function addLootSprites(){
  var regionSize = 10000
  for (var i = 0; i < 100; i++) {
    sprites.loot.push({
      coords: {
        x: Math.round(Math.random() * regionSize) - regionSize/2,
        y: Math.round(Math.random() * regionSize) - regionSize/2
      }
    })
  }
}

var speed = 20
function movePlayerSprite(dir){
  switch(dir){
  case "left":
    playerSprite.coords.x -= speed;
    break;
  case "right":
    playerSprite.coords.x += speed;
    break;
  case "up":
    playerSprite.coords.y -= speed
    break;
  case "down":
    playerSprite.coords.y += speed
    break;
  }
}

var tick
var welcomeDuration = 100
function gameTick(){
  calculateRemaining()
  calculatePlayerMoves()
  calculateCollisions()
  ctx.clearRect(0, 0, viewPort.width, viewPort.height)
  if (tick < welcomeDuration){
    $('#welcomeScreen').css("opacity", 1 - tick / welcomeDuration)
  }
  render()
  tick += 1
}
function render(){
  var remainingPercent = Math.round( ( player.timeRemaining / fullHealth ) * 100 )
  $('#timeRemainingIndicator').text( remainingPercent )
  $('#timeRemainingIndicator').css("width",  remainingPercent + "%")
  $('#timeElapsedIndicator').html(player.timeElapsed)
  if (imagesReady){
    var c = calculateLocalCoords(playerSprite.coords, viewPort)
    ctx.drawImage(playerSpriteImg, c.x, c.y)
  }
  sprites.loot.forEach(function(lootSprite){
    var c = calculateLocalCoords(lootSprite.coords, viewPort)
    ctx.drawImage(medPakImg, c.x, c.y)
  })
  
  drawMiniMap()
}

function calculatePlayerMoves(){
  for (var k in moveKeys){
    movePlayerSprite(k)
    delete moveKeys[k]
  }
}

var frameTime = 1
function calculateRemaining(){
  player.timeRemaining -= frameTime
  player.timeElapsed += frameTime
  if (player.timeRemaining <= 0 ){
    endGame()
  }
}

function addLoot(){
  player.timeRemaining += 100
}

function calculateCollisions(){
  var i = 0;
  sprites.loot.forEach(function(lootSprite){
    if (Math.abs(playerSprite.coords.x - lootSprite.coords.x) < 50 &&
      Math.abs(playerSprite.coords.y - lootSprite.coords.y) < 50){
      var looted = sprites.loot.splice(i, 1)
      addLoot(looted)
    }
    i++
  })
}

function drawMiniMap(){
  minictx.clearRect(0,0, 200, 200)
  sprites.loot.forEach(function(lootSprite){
    minictx.fillStyle = "rgb(256, 0, 0)"
    var localCoords = calculateMiniLocalCoords( lootSprite.coords, miniViewPort, viewPort)
    minictx.fillRect(localCoords.x, localCoords.y, 2, 2)
  })
  drawViewPortOnMini()
  var localCoords = calculateMiniLocalCoords( playerSprite.coords, miniViewPort, viewPort)
  minictx.fillStyle = "rgb(0, 0, 0)"
  minictx.fillRect(localCoords.x, localCoords.y, 2, 2)
}

function calculateLocalCoords(coords, viewPort){
  var x = coords.x - playerSprite.coords.x + (viewPort.width / 2) * viewPort.scale
  var y = coords.y - playerSprite.coords.y + (viewPort.height / 2) * viewPort.scale
  return { 
    x: x,
    y: y,
  }
}

function drawViewPortOnMini(){
  var playerCoords = calculateMiniLocalCoords(playerSprite.coords, miniViewPort, viewPort)
  minictx.strokeRect(
    playerCoords.x - localScale(viewPort.width / 2, viewPort), 
    playerCoords.y - localScale(viewPort.height / 2, viewPort), 
    localScale(viewPort.width, viewPort), 
    localScale(viewPort.height, viewPort)
  )
}

function calculateMiniLocalCoords(coords, viewPort, parentViewPort){
  var x = localScale( coords.x - playerSprite.coords.x, parentViewPort ) + viewPort.width/ 2 
  var y = localScale( coords.y - playerSprite.coords.y, parentViewPort ) + viewPort.height/ 2 
  return { 
    x: x,
    y: y,
  }
}

function localScale(distance, parentViewPort){
  var renderDistance = 20000
  return distance * parentViewPort.width / renderDistance
}
