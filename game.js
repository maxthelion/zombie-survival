var regionSize = 10000
var playerSprite = {
  coords: {
    x: 0,
    y: 0
  }
}
var sprites = {}
var player = {}
var dropLocations = []
var ctx
var playerSpriteImg
var dispatcher = []
var fullHealth = 1000
var fullImmunity = 10000
var defaultTime = 1000
var moves = {x: 0, y: 0}
var speed = 11
var tick
var welcomeDuration = 50
var medPak = {}
var defaultFreshness = 300
var freshnessVariation = 150
var nextDrop = 100
var defaultZombieSpeed = 1
var defaultZombieAttack = 20
var renderDistance = 30000
var tileXNum = map.length
var tileYNum = map[0].length
var tileWidth = regionSize / tileXNum
var tileHeight = regionSize / tileYNum
// var initSprites = require("./lib/init_sprites.js")(sprites)
medPak.health = 50

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

function initGameVars(){
  player = {
    timeRemaining: 0,
    timeElapsed: 0,
    health: fullHealth,
    immunity: fullImmunity
  }
  sprites = {
    loot: [],
    dirt: [],
    zombies: []
  }
  dropLocations = []
  nextDrop = 100
}

var gameInterval
$().ready(function(){
  //initialize stuff
  ctx = document.getElementById('canvas').getContext('2d');
  minictx = document.getElementById('minimap').getContext('2d');
  playerSpriteImg = new Image();
  playerSpriteImg.src = 'images/nerdguy_sprites.png';
  
  zombieSpriteImg = new Image();
  zombieSpriteImg.src = 'images/zombie_sprites.png';
  
  medPakImg = new Image();
  medPakImg.src = 'images/medpak.png';
  
  pointerImg = new Image();
  pointerImg.src = 'images/pointer.png';
  
  grassImg = new Image();
  grassImg.src = 'images/grass_tile.png';
  
  $(document).keydown( handleKeyDown )
  $(document).keyup( handleKeyUp )
  
  startGame()
})

function startGame(){
  addWelcomeMsg()
  initGameVars()
  addLootSprites()
  addMapSprites()
  addDirtSprites()
  addZombieSprites()
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
  $("#container").append(deathScreen)
  clearInterval(gameInterval)
}

function addWelcomeMsg(){
  var welcomeScren = $("<div id=\"welcomeScreen\"><h2>You've been bitten by a zombie!</h2></div>")
  welcomeScren.append("<p>Your only hope is to collect and use the vaccines (<img src=\"images/medpak.png\">) that have been airdropped into this area. They have a very temporary effect though!</p>" )
  welcomeScren.append("<p>Use the arrow keys to move, and consult the map on the right for the locations of the medpaks.</p>" )
  welcomeScren.append("<p><strong>We hope you don't run <i>OUT OF TIME!!!</i></strong></p>" )
  $("#container").append(welcomeScren)
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
  var dropSize = 1000
  var numLoot = 5
  var dropArea = {
    x: Math.round(Math.random() * regionSize) - regionSize/2,
    y: Math.round(Math.random() * regionSize) - regionSize/2
  }
  var dropLocation = { coords: dropArea, availableDrops: numLoot }
  dropLocations.push(dropLocation)
  for (var i = 0; i < numLoot; i++) {
    sprites.loot.push({
      coords: {
        x: Math.round( Math.random() * dropSize ) - dropSize/2 + dropArea.x,
        y: Math.round( Math.random() * dropSize ) - dropSize/2 + dropArea.y
      },
      dropLocation: dropLocation,
      freshness: defaultFreshness + Math.round( Math.random() * freshnessVariation ),
      health: medPak.health
    })
  }
}
function gameTick(){
  player.beingAttacked = false
  calculateRemaining()
  calculatePlayerMoves()
  calculateZombieMoves()
  expireLoot()
  calculateCollisions()
  ctx.clearRect(0, 0, viewPort.width, viewPort.height)
  fadeWelcome()
  if (nextDrop == tick ){
    addLootSprites()
    nextDrop = tick + 200 + Math.round(Math.random() * 50)
    $("body").append("Medkit drop!")
  }
  render()
  tick += 1
}

function render(){
  var remainingPercent = Math.round( ( player.immunity / fullImmunity ) * 100 )
  $('#timeRemainingIndicator').css("width",  remainingPercent + "%")
  var remainingHealthPercent = Math.round( ( player.health / fullHealth ) * 100 )
  $('#healthRemainingIndicator').css("width",  remainingHealthPercent + "%")
  $('#timeElapsedIndicator').html(player.timeElapsed)
  $('#nextDropIndicator').text(nextDrop - tick)
  drawGrass()
  sprites.loot.forEach(function(lootSprite){
    var c = calculateLocalCoords(lootSprite.coords, viewPort)
    ctx.drawImage(medPakImg, c.x, c.y)
  })
  drawZombies()
  drawMiniMap()
  drawPlayerSprite()
  if (player.beingAttacked == true){
    ctx.fillStyle= "rgba(256, 0, 0, "+ 0.3 +")"
  } else {
    var opacity = 0.7 - (remainingPercent / 114)
    ctx.fillStyle = "rgba(0, 0, 0, "+ opacity +")"
  }
  ctx.fillRect(0,0, viewPort.width, viewPort.height)
  
  drawLocators()
}

function drawDirtSprites(){
  sprites.dirt.forEach(function(dirtSprite){
    var c = calculateLocalCoords(dirtSprite.coords, viewPort)
    var clipX = 64 * 1
    var clipY = 0
    ctx.drawImage(grassImg, clipX, clipY, 64, 64, c.x, c.y, 64, 64)
  })
}
function fadeWelcome(){
  if (tick < welcomeDuration){
    $('#welcomeScreen').css("opacity", 1 - tick / welcomeDuration)
  } else if (tick > 98){
    $('#welcomeScreen').remove()
  }
}
function drawZombies(){
  sprites.zombies.forEach(function(zombie){
    var width = 32
    var height = 32
    var clipX = 0
    var clipY = 0
    if (zombie.moves){
      if (zombie.moves.x == 0 && zombie.moves.y == 0){
        var clipX = 0
        var clipY = 2 * height
      } else {
        var i = Math.floor(tick / 3) % 3
        var clipX = i * width
        // left
        if (zombie.moves.x < 0 ){
          var clipY = 1 * height
        } 
        // right
        if (zombie.moves.x > 0 ){
          var clipY = 2 * height
        }
        // up
        if (zombie.moves.x == 0 && zombie.moves.y < 0 ){
          var clipY = 3 * height
        } 
        // down 
        if (zombie.moves.x > 0 && zombie.moves.y == 0 ){
          var clipY = 0
        } 
      }
    }
    var c = calculateLocalCoords(zombie.coords, viewPort)
    drawSprite(zombieSpriteImg, clipX, clipY, width, height, c, zombie)
  }) 
}

function drawSprite(img, clipX, clipY, clipWidth, clipHeight, coords, sprite){
  var drawnWidth = 50
  var drawnHeight = 60
  ctx.drawImage(img, 
    clipX, clipY, 
    clipWidth, clipHeight, 
    coords.x - drawnWidth /2, coords.y - (drawnHeight - 10), 
    drawnWidth, drawnHeight
  )
  ctx.fillStyle = "rgb(150, 255, 255)"
  ctx.fillRect(coords.x, coords.y, 2, 2)
}

var dir = "down"
function drawPlayerSprite(){
  var clipWidth = 68
  var clipHeight = 92

  if (moves.x == 0 && moves.y == 0){
    var clipX = 0
    var clipY = 2 * clipHeight
  } else {
    var i = Math.floor(tick / 3) % 3
    var clipX = i * clipWidth
    // left
    if (moves.y < 0 ){
      var clipY = 0
    } 
    // right
    if (moves.y > 0 ){
      var clipY = 2 * 92
    }
    // up
    if (moves.x < 0 && moves.y == 0 ){
      var clipY = 3 * 92
    } 
    // down 
    if (moves.x > 0 && moves.y == 0 ){
      var clipY = 1 * 92
    } 
  }

  var c = calculateLocalCoords(playerSprite.coords, viewPort)
  drawSprite(playerSpriteImg, clipX, clipY, clipWidth, clipHeight, c, playerSprite)
}

function expireLoot(){
  sprites.loot.forEach(function(loot, index){
    if(loot.freshness >= 1){
      loot.freshness -= 1
    } else {
      removeLoot(loot)
    }
  })
}

function drawGrass(){
  var widthTiles = (viewPort.width / tileWidth) + 1
  var heightTiles = (viewPort.height / tileHeight) + 1
  var topCornerX = (playerSprite.coords.x - (viewPort.width / 2)) - playerSprite.coords.x % tileWidth
  var topCornerY = (playerSprite.coords.y - (viewPort.width / 2)) - playerSprite.coords.y % tileHeight
  for (var x = -1; x <= widthTiles; x++) {
    for (var y = -1; y <= heightTiles; y++) {
      var tileCoords = {
        x: topCornerX + (x * tileWidth),
        y: topCornerY + (y * tileHeight)
      }
      var tileIndexCoords = tileIndex(tileCoords) 
      if (tileAtCoords(tileCoords) === 1){
        var c = calculateLocalCoords({x: tileCoords.x, y: tileCoords.y}, viewPort)
        drawTile(c, tileIndexCoords)
      }
    }
  }
}
function tileIndex(coords){
  return { 
    x: Math.floor( coords.x / tileWidth) + (tileXNum / 2),
    y: Math.floor( coords.y / tileWidth) + (tileYNum / 2)
  }
}
function tileAtCoords(coords){
  var tileIndexCoords = tileIndex(coords) 
  return map[tileIndexCoords.x][tileIndexCoords.y]
}
function drawTile(coords, index){
  var cx = 128
  var cy = 128
  if (map[index.x -1][index.y] === 0){
    cx = 64
  }
  if (map[index.x + 1][index.y] === 0){
    cx = 192
  }
  if (map[index.x][index.y - 1] === 0){
    cy = 64
  }
  if (map[index.x][index.y + 1] === 0){
    cy = 192
  }
  ctx.drawImage(grassImg,
    cx,cy,
    64, 64,
    coords.x, coords.y,
    tileWidth, tileHeight
  )
}
function calculateZombieMoves(){
  var i = 0;
  sprites.zombies.forEach(function(zombieSprite){
    zombieSprite.moves.x = 0
    zombieSprite.moves.y = 0
    zombieSprite.attacking = false
    if (
        Math.abs(playerSprite.coords.x - zombieSprite.coords.x) < viewPort.width / 2 &&
        Math.abs(playerSprite.coords.y - zombieSprite.coords.y) < viewPort.width / 2 ){
      if (
          Math.abs(playerSprite.coords.x - zombieSprite.coords.x) < 30 &&
          Math.abs(playerSprite.coords.y - zombieSprite.coords.y) < 30 ){
        // too close 
        zombieSprite.attacking = true
      } else {
        if ( playerSprite.coords.x > zombieSprite.coords.x) {
          zombieSprite.moves.x = 1
          zombieSprite.coords.x += zombieSprite.speed
        } else if ( playerSprite.coords.x < zombieSprite.coords.x) {
          zombieSprite.moves.x = -1
          zombieSprite.coords.x -= zombieSprite.speed
        } 
        if ( playerSprite.coords.y < zombieSprite.coords.y) {
          zombieSprite.moves.y = -1
          zombieSprite.coords.y -= zombieSprite.speed
        } else if ( playerSprite.coords.y > zombieSprite.coords.y) {
          zombieSprite.moves.y = 1
          zombieSprite.coords.y += zombieSprite.speed
        }
      }
    }
    if (zombieSprite.attacking == true) {
      attackPlayer(zombieSprite)
    }
    i++
  })
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
  
  var newCoords = {
    x: playerSprite.coords.x + moves.x,
    y: playerSprite.coords.y + moves.y
  }
  if (tileAtCoords(newCoords) === 1){
    playerSprite.coords = newCoords
  }
}

var frameTime = 1
function calculateRemaining(){
  player.immunity -= frameTime
  player.timeElapsed += 1
  if (player.immunity <= 0 ){
    endGame("zombie")
  }
}

function addLoot(loot){
  player.timeRemaining += loot.health
  removeLoot(loot)
}

function removeLoot(oldLoot){
  var dropLocation = oldLoot.dropLocation
  sprites.loot.forEach(function(loot, index){
    if (loot == oldLoot){
      sprites.loot.splice(index, 1)
    }
  })
  dropLocation.availableDrops -= 1
  if (dropLocation.availableDrops == 0){
    removeDroplocation(dropLocation)
  }
}
function removeDroplocation(oldDropLocation){
  dropLocations.forEach(function(dropLocation, index){
    if (dropLocation == oldDropLocation){
      dropLocations.splice(index, 1)
    }
  })
}

function attackPlayer(zombieSprite){
  player.health -= zombieSprite.attackValue
  if (player.health < 1){
    endGame("died")
  }
  player.beingAttacked = true
}

function calculateCollisions(){
  var i = 0;
  sprites.loot.forEach(function(lootSprite){
    if (Math.abs(playerSprite.coords.x - lootSprite.coords.x) < 40 &&
      Math.abs(playerSprite.coords.y - lootSprite.coords.y) < 40){
      addLoot(lootSprite)
    }
    i++
  })
}

function drawMiniMap(){
  minictx.clearRect(0,0, miniViewPort.width, miniViewPort.height)
  drawMiniTiles()
  sprites.loot.forEach(function(lootSprite){
    minictx.fillStyle = "rgb(0, 150, 0)"
    var localCoords = calculateMiniLocalCoords( lootSprite.coords, miniViewPort, viewPort)
    minictx.fillRect(localCoords.x, localCoords.y, 2, 2)
  })
  
  drawViewPortOnMini()
  var localCoords = calculateMiniLocalCoords( playerSprite.coords, miniViewPort, viewPort)
  minictx.fillStyle = "rgb(0, 0, 0)"
  minictx.fillRect(localCoords.x, localCoords.y, 2, 2)
}

function drawMiniTiles(){
  sprites.mapTiles.forEach(function(tileSprite){
    minictx.fillStyle = "rgb(0, 150, 0)"
    var localCoords = calculateMiniLocalCoords( tileSprite.coords, miniViewPort, viewPort)
    minictx.fillRect(localCoords.x, localCoords.y, 2, 2)
  })
}

function drawLocators(){
  dropLocations.forEach(function(dropLocation){
    var x1 = dropLocation.coords.x
    var y1 = dropLocation.coords.y
    var x2 = playerSprite.coords.x
    var y2 = playerSprite.coords.y
    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle  = Math.atan2(y2 - y1, x2 - x1) + ( Math.PI / 2);
    if (length > 300){
      ctx.save()
      ctx.translate(viewPort.width / 2, viewPort.height / 2)
      ctx.rotate(angle)
      var width = 64
      var height = 64
      ctx.drawImage(pointerImg, 0 - width / 2, ( length / regionSize ) * 200 + 30)
      ctx.restore()
    }
  })
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
  return distance * parentViewPort.width / renderDistance
}

// init sprites 
function addMapSprites(){
  sprites.mapTiles = []
  for (var x = 0; x < tileXNum; x++) {
    for (var y = 0; y < tileYNum; y++) {
      if(map[x][y] === 1){
        sprites.mapTiles.push({
          coords: {
            x: (tileWidth * x) - regionSize/2,
            y: (tileHeight * y) - regionSize/2
          }
        })
      }
    }
  }
}
function addZombieSprites(){
  for (var i = 0; i < 100; i++) {
    sprites.zombies.push({
      health: 20,
      sprite: 0,
      speed: defaultZombieSpeed,
      moves: {x: 0, y: 0},
      attackValue: defaultZombieAttack,
      coords: {
        x: Math.round(Math.random() * regionSize) - regionSize/2,
        y: Math.round(Math.random() * regionSize) - regionSize/2
      }
    })
  }
}

function addDirtSprites(){
  for (var i = 0; i < 1000; i++) {
    sprites.dirt.push({
      coords: {
        x: Math.round(Math.random() * regionSize) - regionSize/2,
        y: Math.round(Math.random() * regionSize) - regionSize/2
      }
    })
  }
}