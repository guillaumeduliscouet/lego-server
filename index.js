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
var ClientOrder = function(clientName) {
  this.clientName = clientName;
  this.toPrepare = [];
  this.prepared = [];
}
var StockEntry = function(id, color) {
  this.id = id;
  this.color = color;
}

//DATA
var inStock = [];
inStock.push(new StockEntry("123456789", "blue"));
inStock.push(new StockEntry("123456790", "green"));
var clientOrders = [];

//FUNCTIONS
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

//ROUTES
app.get('/stock', function(req, res) {
  res.json({stock : inStock});
})

app.get('/clientOrders', function(req, res) {
  res.json(clientOrders);
})

app.post('/newClientOrder', function(req, res) {
  clientOrders.push(req.body.clientOrder);
  res.status(200).end();
})

app.post('/stockIn', function(req, res) {
  inStock.push(req.body.stockEntry);
  res.status(200).end();
})

app.post('/stockOut', function(req, res) {
  var index = isInStock(req.body.stockEntry.id);
  if(index != -1) {
    if(tryUpdateOrder(req.body.stockEntry.color)) {
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
