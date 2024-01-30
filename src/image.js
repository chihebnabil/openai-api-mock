const { faker } = require('@faker-js/faker');


function getImageResponce(requestBody) {

  const n = requestBody.n || 1;
  const data = [];
  for (let i = 0; i < n; i++) {
    data.push({
      revised_prompt: faker.lorem.words(5),
      url: "http://via.placeholder.com/" + requestBody.size
    });
  }

  return {
    created: Math.floor(Date.now() / 1000),
    data: data
  };
}




module.exports = {
  getImageResponce,
};
