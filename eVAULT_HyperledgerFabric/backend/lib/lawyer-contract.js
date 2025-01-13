/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class LawyerContract extends Contract {

    async lawyerExists(ctx, lawyerId) {
        const buffer = await ctx.stub.getState(lawyerId);
        return (!!buffer && buffer.length > 0);
    }

    async createLawyer(ctx, lawyerId, value) {
        const exists = await this.lawyerExists(ctx, lawyerId);
        if (exists) {
            throw new Error(`The lawyer ${lawyerId} already exists`);
        }
        const asset = { value };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(lawyerId, buffer);
    }

    async readLawyer(ctx, lawyerId) {
        const exists = await this.lawyerExists(ctx, lawyerId);
        if (!exists) {
            throw new Error(`The lawyer ${lawyerId} does not exist`);
        }
        const buffer = await ctx.stub.getState(lawyerId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateLawyer(ctx, lawyerId, newValue) {
        const exists = await this.lawyerExists(ctx, lawyerId);
        if (!exists) {
            throw new Error(`The lawyer ${lawyerId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(lawyerId, buffer);
    }

    async deleteLawyer(ctx, lawyerId) {
        const exists = await this.lawyerExists(ctx, lawyerId);
        if (!exists) {
            throw new Error(`The lawyer ${lawyerId} does not exist`);
        }
        await ctx.stub.deleteState(lawyerId);
    }

}

module.exports = LawyerContract;
