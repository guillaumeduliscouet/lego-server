var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//DATA STRUCT
var OrderEntry = function(color, quantity) {
  this.color = color;
  this.quantity = quantity;
}
var ClientOrder = function(clientName, toPrepare, prepared) {
  this.clientName = clientName;
  this.toPrepare = toPrepare;
  this.prepared = prepared;
}
var StockEntry = function(id, color) {
  this.id = id;
  this.color = color;
}

//DATA
var inStock;
var inStockGroups;
var clientOrders;
initData();

//FUNCTIONS
function initData() {
  inStock = [];
  inStockGroups = [];
  clientOrders = [];
}

function isInStock(id) {
  for(i = 0; i < inStock.length; i++) {
    if(id === inStock[i].id) {
      return i;
    }
  }
  return -1;
}

/*If the color is still needed for first order in queue, update order and
  return true. Else do nothing and return false*/
function tryUpdateOrder(color) {
  if(clientOrders.length != 0) {
    var order = clientOrders[0].toPrepare;
    for(i = 0; i < order.length; i++) {
      if(order[i].color === color && order[i].quantity > 0) {
        order[i].quantity--;
        if(order[i].quantity == 0) {  //remove color if no more needed
          order.splice(i,1);
        }
        if(order.length == 0) { //remove order if completed
          clientOrders.splice(0,1);
        }
        return true;
      }
    }
    return false;
  }
}

/*inStockGroups takes into account the orders to prepare, we need to update it
  with every new order*/
function updateStockGroupsOrder(toPrepare) {
  for(i = 0; i < toPrepare.length; i++) {
    updateStockGroups(toPrepare[i].color, -toPrepare[i].quantity);
  }
}

function updateStockGroups(color, quantity) {
  var i = 0;
  for (i; i < inStockGroups.length; i++) {
    if(inStockGroups[i].color === color) {
      inStockGroups[i].quantity += quantity;
      break;
    }
  }
  if (i == inStockGroups.length) {  //new entry, add it
    inStockGroups.push(new OrderEntry(color, quantity));
  } else if(inStockGroups[i].quantity == 0) { //entry to 0, remove it
    inStockGroups.splice(i,1);
  }
}

//ROUTES
app.get('/init', function(req, res) {
  initData();
  res.json(inStock);
})

app.get('/stock', function(req, res) {
  res.json(inStock);
})

app.get('/stockGroups', function(req, res) {
  res.json(inStockGroups);
})

app.get('/clientOrders', function(req, res) {
  res.json(clientOrders);
})

app.post('/newClientOrder', function(req, res) {
  updateStockGroupsOrder(req.body.toPrepare);
  clientOrders.push(req.body);
  res.status(200).end();
})

app.post('/stockIn', function(req, res) {
  var index = isInStock(req.body.id);
  if(index == -1) {
    updateStockGroups(req.body.color, 1);
    inStock.push(req.body);
    res.status(200).end();
  }
  else {  // the lego is already in stock, do nothing
    res.status(201).end();
  }
})

app.post('/stockOut', function(req, res) {
  var index = isInStock(req.body.id);
  if(index != -1) {
    if(tryUpdateOrder(req.body.color)) {
      inStock.splice(index, 1);
      res.status(200).end();
    }
    else {  // the lego isn't needed in first command, abort
      res.status(201).end();
    }
  }
  else {  // the lego shouldn't be in the warehouse, abort
    res.status(202).end();
  }
})

var listener = app.listen(process.env.PORT || 3000);
console.log('Listening on port ' + listener.address().port);
