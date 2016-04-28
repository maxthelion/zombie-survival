var playerSprite = {
  coords: {
    x: 250,
    y: 250
  }
}
var sprites = {
  players: [],
  loot: [],
  dirt: []
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
var fullHealth = 1000 //used?
var defaultTime = 1000
var moves = {x: 0, y: 0}
var speed = 20
var tick
var welcomeDuration = 100
var medPak = {}
var defaultFreshness = 300
var freshnessVariation = 150
var nextDrop = 100
medPak.health = 20
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
  playerSpriteImg.src = 'images/raza54bbig1_1.png';
  
  medPakImg = new Image();
  medPakImg.onload = function(){
    imagesReady = true
  };
  medPakImg.src = 'images/medpak.png';
  
  grassImg = new Image();
  grassImg.onload = function(){
    imagesReady = true
  };
  grassImg.src = 'images/grass_tile.jpg';
  
  dirtImg = new Image();
  dirtImg.onload = function(){
    imagesReady = true
  };
  dirtImg.src = 'images/grass_dirt_tile.jpg';
  
  $(document).keydown( handleKeyDown )
  $(document).keyup( handleKeyUp )
  
  startGame()
})

function startGame(){
  addWelcomeMsg()
  addLootSprites()
  addDirtSprites()
  player.timeRemaining = defaultTime
  $('#welcomeScreen').css("opacity", 1)
  tick = 0
  gameInterval = setInterval(gameTick, 50)
}

function endGame(){
  var deathScreen = $("<div id=\"deathScreen\"><h2> You turned into a zombie!</h2></div>")
  deathScreen.append("<p>You survived for a duration of " + player.timeElapsed + "</p>" )
  deathScreen.append("<img src=\"images/genericZombieMale.png\"/>" )
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
function handleKeyDown(event){
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

function handleKeyUp(event){
  if ( event.which == 37 ) {
    moveKeys.left = false
    event.preventDefault();
  } 
  if ( event.which == 39 ) {
    moveKeys.right = false
    event.preventDefault();
  } 
  if ( event.which == 38 ) {
    moveKeys.up = false
    event.preventDefault();
  } 
  if ( event.which == 40 ) {
    moveKeys.down = false
    event.preventDefault();
  }
}

function addLootSprites(){
  var regionSize = 10000
  var dropSize = 1000
  var numLoot = 5
  var dropArea = {
    x: Math.round(Math.random() * regionSize) - regionSize/2,
    y: Math.round(Math.random() * regionSize) - regionSize/2
  }
  for (var i = 0; i < numLoot; i++) {
    sprites.loot.push({
      coords: {
        x: Math.round( Math.random() * dropSize ) - dropSize/2 + dropArea.x,
        y: Math.round( Math.random() * dropSize ) - dropSize/2 + dropArea.y
      },
      freshness: defaultFreshness + Math.round( Math.random() * freshnessVariation )
    })
  }
}

function addDirtSprites(){
  var regionSize = 10000
  for (var i = 0; i < 1000; i++) {
    sprites.dirt.push({
      coords: {
        x: Math.round(Math.random() * regionSize) - regionSize/2,
        y: Math.round(Math.random() * regionSize) - regionSize/2
      }
    })
  }
}

function gameTick(){
  calculateRemaining()
  calculatePlayerMoves()
  expireLoot()
  calculateCollisions()
  ctx.clearRect(0, 0, viewPort.width, viewPort.height)
  if (tick < welcomeDuration){
    $('#welcomeScreen').css("opacity", 1 - tick / welcomeDuration)
  } else if (tick > 98){
    $('#welcomeScreen').remove()
  }
  if (nextDrop == tick ){
    addLootSprites()
    nextDrop = tick + 200 + Math.round(Math.random() * 50)
    $("body").append("Medkit drop!")
  }
  render()
  tick += 1
}

function render(){
  var remainingPercent = Math.round( ( player.timeRemaining / fullHealth ) * 100 )
  $('#timeRemainingIndicator').text( remainingPercent )
  $('#timeRemainingIndicator').css("width",  remainingPercent + "%")
  $('#timeElapsedIndicator').html(player.timeElapsed)
  $('#nextDropIndicator').text(nextDrop - tick)
  drawGrass()
  sprites.dirt.forEach(function(dirtSprite){
    var c = calculateLocalCoords(dirtSprite.coords, viewPort)
    ctx.drawImage(dirtImg, c.x, c.y)
  })
  sprites.loot.forEach(function(lootSprite){
    var c = calculateLocalCoords(lootSprite.coords, viewPort)
    ctx.drawImage(medPakImg, c.x, c.y)
  })
  drawPlayerSprite()
  drawMiniMap()
}
var dir = "down"
function drawPlayerSprite(){
  var clipX = 0
  var clipY = 250
  if (moves.y < 0 && moves.x == 0 ){
    var clipX = 45
    var clipY = 0
  } 
  if (moves.y > 0 && moves.x == 0 ){
    var clipX = 0
    var clipY = 0
  }
  if (moves.x < 0 && moves.y == 0 ){
    var clipX = 140
    var clipY = 0
  } 
  if (moves.x > 0 && moves.y == 0 ){
    var clipX = 90
    var clipY = 0
  }     
  // if (moves.y < 0)
    var clipY = 0
  var c = calculateLocalCoords(playerSprite.coords, viewPort)
  ctx.drawImage(playerSpriteImg, clipX, clipY, 50, 55, c.x, c.y, 50, 60)
}

function expireLoot(){
  sprites.loot.forEach(function(loot, index){

    if(loot.freshness >= 1){
      loot.freshness -= 1
    } else {
      console.log("expire")
      sprites.loot.splice(index, 1)
    }
  })
}

function drawGrass(){
  var widthTiles = (viewPort.width / 64) + 1
  var heightTiles = (viewPort.height / 64) + 1
  for (var x = -1; x < widthTiles; x++) {
    for (var y = -1; y < heightTiles; y++) {
      ctx.drawImage(grassImg, 
        x * 64 - (playerSprite.coords.x % 64), 
        y * 64 - (playerSprite.coords.y % 64)
      )
    }
  }
}

function calculatePlayerMoves(){
  moves = {x: 0, y: 0}
  if (moveKeys.left)
    moves.x -= speed;
  if (moveKeys.right)
    moves.x += speed;
  if (moveKeys.up)
    moves.y -= speed
  if (moveKeys.down)
    moves.y += speed
    
  playerSprite.coords.x += moves.x
  playerSprite.coords.y += moves.y
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
  player.timeRemaining += medPak.health
}

function calculateCollisions(){
  var i = 0;
  sprites.loot.forEach(function(lootSprite){
    if (Math.abs(playerSprite.coords.x - lootSprite.coords.x) < 40 &&
      Math.abs(playerSprite.coords.y - lootSprite.coords.y) < 40){
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
  var renderDistance = 50000
  return distance * parentViewPort.width / renderDistance
}
