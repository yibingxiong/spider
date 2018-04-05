function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {resolve(5)}, ms);
    });
  }
async function test() {
    await console.log(1);
    let k = await delay(10000);
    console.log(k);
}

test();