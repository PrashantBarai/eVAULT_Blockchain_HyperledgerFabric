export PATH=$PATH:$HOME/evoting_raft/bin
export CHANNEL_NAME="mychannel"
export FABRIC_CFG_PATH=$PWD

mkdir -p ./hyperledger/channel-artifacts

# Genesis block creation
FILE="./hyperledger/artifacts/genesis.block"     

CONSENSUS_TYPE="etcdraft" # you can change consensus algo here. currently working for raft
CHANNEL_CREATE_ID="electionchannel"

function generateChannelArtifacts() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting"
    exit 1
  fi

  echo "##########################################################"
  echo "#########  Generating Orderer Genesis block ##############"
  echo "##########################################################"
  # Note: For some unknown reason (at least for now) the block file can't be
  # named orderer.genesis.block or the orderer will fail to launch!
  echo "CONSENSUS_TYPE= "$CONSENSUS_TYPE
  echo "CHANNEL NAME= "$CHANNEL_NAME
  set -x
  if [ "$CONSENSUS_TYPE" == "solo" ]; then
    configtxgen -profile OneOrgsOrdererGenesis -channelID $CHANNEL_CREATE_ID -outputBlock ./hyperledger/channel-artifacts/genesis.block
  elif [ "$CONSENSUS_TYPE" == "kafka" ]; then
    configtxgen -profile SampleDevModeKafka -channelID $CHANNEL_CREATE_ID -outputBlock ./hyperledger/channel-artifacts/genesis.block
  elif [ "$CONSENSUS_TYPE" == "etcdraft" ]; then
    configtxgen -profile SampleMultiNodeEtcdRaft -channelID $CHANNEL_CREATE_ID -outputBlock ./hyperledger/channel-artifacts/genesis.block
  else
    set +x
    echo "unrecognized CONSESUS_TYPE='$CONSENSUS_TYPE'. exiting"
    exit 1
  fi
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi
  echo
  echo "#################################################################"
  echo "### Generating channel configuration transaction 'channel.tx' ###"
  echo "#################################################################"
  set -x
   configtxgen -profile OneOrgsChannel1 -outputCreateChannelTx ./hyperledger/channel-artifacts/supplychainchannel.tx -channelID supplychainchannel


  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for ECMSP   ##########"
  echo "#################################################################"
  set -x
configtxgen  -profile OneOrgsChannel1 -outputAnchorPeersUpdate ./hyperledger/channel-artifacts/ECMSPanchors1.tx -channelID supplychainchannel -asOrg ECMSP


  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for ECMSP..."
    exit 1
  fi
}

generateChannelArtifacts
