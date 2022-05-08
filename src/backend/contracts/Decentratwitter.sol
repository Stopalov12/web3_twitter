//SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Decentratwitter is ERC721URIStorage {
    uint256 public tokenCount;
    uint256 public postCount;

    mapping(uint256 => Post) public posts;
    mapping(address => uint256) public profiles;

    event PostCreated(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );
    event PostTipped(
        uint256 id,
        string hash,
        uint256 tipAmount,
        address payable author
    );

    struct Post {
        uint256 id;
        string hash;
        uint256 tipAmount;
        address payable author;
    }

    constructor() ERC721("Decentratwitter", "DT") {}

    function mint(string calldata _tokenURI) external returns (uint256) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return tokenCount;
    }

    function setProfile(uint256 _id) public {
        require(
            ownerOf(_id) == msg.sender,
            "Must own the nft you want to select as your profile"
        );
        profiles[msg.sender] = _id;
    }

    function uploadPost(string memory _postHash) external {
        //check that the user owns an nft
        require(
            balanceOf(msg.sender) > 0,
            "Must own a decentratwitter nft to post"
        );
        // ensure the posthash exists
        require(bytes (_postHash).length > 0 , "Post hash does not exist");
        postCount++;
        posts[postCount] = Post(postCount, _postHash, 0, payable(msg.sender));
        emit PostCreated(postCount, _postHash, 0, payable (msg.sender));
    }

    function tipPostOwner(uint256 _id) external payable {
        //ensure the id is valid
        require(_id > 0 && _id <= postCount, "Invalid post id");
        //fetch the post
        Post memory _post = posts[_id];
        require(_post.author != msg.sender, "Cannot tip your own post");
        _post.author.transfer(msg.value);
        _post.tipAmount += msg.value;
        posts[_id] = _post;
        emit PostTipped(_id, _post.hash, _post.tipAmount, _post.author);
    }
    function getAllPosts() external view returns (Post[] memory _posts){
        _posts = new Post[](postCount);
        for (uint i = 0; i<postCount; i++){
            _posts[i] = posts[i+1];
        }
    }

//Fetches all the NFTS

function getMyNfts() external view returns (uint[] memory _ids){
    _ids = new uint[](balanceOf(msg.sender));
    uint currentIndex;
    uint _tokenCount = tokenCount;
    for(uint i=0; i<_tokenCount;i++){
        if(ownerOf(i+1) == msg.sender){
            _ids[currentIndex] = i+1;
            currentIndex++;
        }
    }
}
}
