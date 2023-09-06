// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import {Verifier} from "./verifier.sol";

contract Master {
    event Despoit(uint256 commitment, uint amount);

    mapping(uint => uint) public proofs;

    Verifier v;

    constructor() {
        v = new Verifier();
    }

    function deposit(uint commitment) public payable {
        proofs[commitment] = msg.value;
        emit Despoit(commitment, msg.value);
    }

    function withdraw(
        uint commitment,
        Verifier.Proof memory proof,
        uint[9] memory inputs
    ) public {
        uint amount = inputs[0];
        require(v.verifyTx(proof, inputs));
        require(proofs[commitment] == amount);

        payable(msg.sender).transfer(amount);
    }
}
