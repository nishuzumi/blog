import { expect } from "chai";
import { ethers } from "hardhat";
import { Verifier } from "../typechain-types/Verifier";
import { CompilationArtifacts, ZoKratesProvider } from "zokrates-js";
import { readFileSync } from "fs";
import { Master } from "../typechain-types";
import { resolve } from 'path'

describe("Verifier", function () {
  let master: Master;
  let zokratesProvider: ZoKratesProvider

  const zokArtifacts: CompilationArtifacts = {
    program: readFileSync(resolve(__dirname, '../zok/out')),
    abi: JSON.parse(readFileSync(resolve(__dirname, '../zok/abi.json'), 'utf-8'))
  }

  const provingKey = readFileSync(resolve(__dirname, '../zok/proving.key'))

  beforeEach(async () => {
    const { initialize } = await import("zokrates-js");
    zokratesProvider = (await initialize()).withOptions({
      backend: 'ark',
      curve: 'bn128',
      scheme: 'gm17'
    });

    const bn256 = await ethers.getContractFactory("BN256G2").then((f) => f.deploy());

    master = await ethers.getContractFactory("Master", {
      libraries: {
        "contracts/verifier.sol:BN256G2": bn256.address,
      }
    }).then((f) => f.deploy());
  })

  it("should verify a proof", async () => {
    const { witness, output } = zokratesProvider.computeWitness(
      zokArtifacts,
      [`${ethers.constants.WeiPerEther}`, '23'],
    )

    const commitment = hexListToUint256BigEndian(JSON.parse(output)).toString();

    await master.deposit(
      commitment,
      { value: ethers.constants.WeiPerEther }
    )

    const proof = zokratesProvider.generateProof(
      zokArtifacts.program,
      witness,
      provingKey);


    const sender = (await ethers.getSigners())[0];
    expect(() => master.connect(sender).
      withdraw(commitment, proof.proof as Verifier.ProofStruct, proof.inputs)
    ).to.changeEtherBalance(sender, ethers.constants.WeiPerEther);
  })
});


function hexListToUint256BigEndian(hexList: string[]) {
  let uint256Data = "0x";
  for (const hex of hexList) {
    const cleanedHex = hex.replace("0x", "");
    uint256Data += cleanedHex;
  }
  const uint256BigNumber = ethers.BigNumber.from(uint256Data);
  return uint256BigNumber;
}