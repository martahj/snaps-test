// const ethers = require('ethers');

// const provider = new ethers.providers.Web3Provider(wallet);

const baseUrl = 'http://localhost:3000/api';
// const erc721AbbreviatedAbi = [
//   {
//     inputs: [
//       {
//         internalType: 'address',
//         name: 'owner',
//         type: 'address',
//       },
//     ],
//     name: 'balanceOf',
//     outputs: [
//       {
//         internalType: 'uint256',
//         name: '',
//         type: 'uint256',
//       },
//     ],
//     stateMutability: 'view',
//     type: 'function',
//   },
// ];

wallet.registerRpcMessageHandler(async (originString, requestObject) => {
  switch (requestObject.method) {
    case 'hello':
      try {
        // const got = await provider.listAccounts();
        // console.log({ got });
        const contract = await getContract(originString);

        if (!contract) {
          await showUserMessage(
            'Could not verify site project',
            `We couldn't verify that this site is associated with a SuppDapp project. Please proceed with caution, as it may be a scam.`,
          );
          return {
            valid: false,
          }
        }

        const etherscanAddress = getEtherscanAddress(contract);

        // const contractInstance = new ethers.Contract(contract, erc721AbbreviatedAbi, provider);

        let openseaUrl;
        let error;
        try {
          openseaUrl = await getOpenseaUrl(contract);
        } catch (err) {
          error = err;
        }

        if (error || !openseaUrl) {
          showUserMessage(
            `Verified project`,
            `We verified that this url is associated with the contract at ${etherscanAddress} but were not able to find an associated OpenSea collection. Carefully review this information; if it does not match your expectations, it may be a scam.`
          )
          return {
            valid: true,
            contract,
          }
        }

        showUserMessage(
          `Verified project`,
          `We verified that this url is associated with the contract at ${etherscanAddress} and at OpenSea at ${openseaUrl}. Carefully review this information; if it does not match your expectations, it may be a scam.`
        );

        return { valid: true, contract };
      } catch(err) {
        console.warn(err);
        return { valid: false }
      }
    default:
      throw new Error('Method not found.');
  }
});

async function getContract(url) {
  // return null;
  // return '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'; // TODO
  const response = await fetch(`${baseUrl}/fetch?origin=${url}`)
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  return result.contract;
}

function getEtherscanAddress(contract) {
  return `https://etherscan.io/address/${contract}`;
}

function getCollectionUrl(slug) {
  return `https://opensea.io/collection/${slug}`;
}

async function getOpenseaUrl(contract) {
  const response = await fetch(
    `https://api.opensea.io/api/v1/asset_contract/${contract}`,
  );
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  const { slug } = result.collection;
  return getCollectionUrl(slug);
}

function showUserMessage(title, content) {
  return wallet.request({
    method: 'snap_confirm',
    params: [
      {
        prompt: title,
        textAreaContent: content,
      },
    ],
  });
}