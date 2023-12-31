// import Moralis from 'moralis';

// export default async function handler(req, res) {
//   const { address, network } = req.body;
//   await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

//   try {
//     const data = await Moralis.SolApi.nft.getNFTMetadata({
//       network,
//       address,
//     });
//     res.status(200).json(data);
//   } catch (error) {
//     res.status(400).json(error);
//   }
// }

import Moralis from "moralis";

export default async function handler(req, res) {
  const { address, network } = req.body;

  await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

  try {
    const data = await Moralis.SolApi.account.getNFTs({
      address: address,
      network: network,
    });

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
}


