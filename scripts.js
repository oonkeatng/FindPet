const app = document.getElementById('root');

const container = document.createElement('div');
const test = document.createElement('p');
container.setAttribute('class', 'container');

//app.appendChild(logo);
app.appendChild(container);
app.appendChild(test);
var request = new XMLHttpRequest();
request.open('GET', 'http://localhost:8080/api/pets', true);
request.onload = function () {

  // Begin accessing JSON data here
  var data = JSON.parse(this.response);
  if (request.status >= 200 && request.status < 400) {
    data.forEach(pet => {
      const card = document.createElement('div');
      card.setAttribute('class', 'card');

      const h1 = document.createElement('h1');
      h1.textContent = "ID: " + pet.id;

      //add a new line
      const br = document.createElement("br");
    
      const petname = document.createElement('p');
      petname.textContent = `Name: ${pet.name}`;

      const petspecies = document.createElement('p');
      petspecies.textContent = `Species: ${pet.species}`;

      const petage = document.createElement('p');
      petage.textContent = `Age: ${pet.age}`;

      const petavailable = document.createElement('p');
      var strDate = pet.available_from;
      strDate = strDate.substring(0, 10);
      petavailable.textContent = `Available: ${strDate}`;

      const petstatus = document.createElement('p');
      if (pet.adopted)
      {
        petstatus.textContent = "Status: Adopted";
      }
      else
      {
        petstatus.textContent = "Status: Available";
      }

      container.appendChild(card);
      card.appendChild(h1);
      card.appendChild(petname);
      card.appendChild(petspecies);
      if(pet.species == "dog")
      {
        const petbreed = document.createElement('p');
        petbreed.textContent = `Breed: ${pet.breed}`;
        card.appendChild(petbreed);
      }
      card.appendChild(petage);
      card.appendChild(petavailable);
      card.appendChild(petstatus);
    });
  } else {
    const errorMessage = document.createElement('marquee');
    errorMessage.textContent = `Gah, it's not working!`;
    app.appendChild(errorMessage);
  }
}

request.send();