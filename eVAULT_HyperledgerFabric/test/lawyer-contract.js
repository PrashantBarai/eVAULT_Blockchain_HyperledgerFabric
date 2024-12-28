/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { LawyerContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('LawyerContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new LawyerContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"lawyer 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"lawyer 1002 value"}'));
    });

    describe('#lawyerExists', () => {

        it('should return true for a lawyer', async () => {
            await contract.lawyerExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a lawyer that does not exist', async () => {
            await contract.lawyerExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createLawyer', () => {

        it('should create a lawyer', async () => {
            await contract.createLawyer(ctx, '1003', 'lawyer 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"lawyer 1003 value"}'));
        });

        it('should throw an error for a lawyer that already exists', async () => {
            await contract.createLawyer(ctx, '1001', 'myvalue').should.be.rejectedWith(/The lawyer 1001 already exists/);
        });

    });

    describe('#readLawyer', () => {

        it('should return a lawyer', async () => {
            await contract.readLawyer(ctx, '1001').should.eventually.deep.equal({ value: 'lawyer 1001 value' });
        });

        it('should throw an error for a lawyer that does not exist', async () => {
            await contract.readLawyer(ctx, '1003').should.be.rejectedWith(/The lawyer 1003 does not exist/);
        });

    });

    describe('#updateLawyer', () => {

        it('should update a lawyer', async () => {
            await contract.updateLawyer(ctx, '1001', 'lawyer 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"lawyer 1001 new value"}'));
        });

        it('should throw an error for a lawyer that does not exist', async () => {
            await contract.updateLawyer(ctx, '1003', 'lawyer 1003 new value').should.be.rejectedWith(/The lawyer 1003 does not exist/);
        });

    });

    describe('#deleteLawyer', () => {

        it('should delete a lawyer', async () => {
            await contract.deleteLawyer(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a lawyer that does not exist', async () => {
            await contract.deleteLawyer(ctx, '1003').should.be.rejectedWith(/The lawyer 1003 does not exist/);
        });

    });

});
