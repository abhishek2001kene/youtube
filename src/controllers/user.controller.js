import { asyncHandler } from "../utils/asyncHandler.js";
import { User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudniary.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import { json } from "express";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";








const sanitizeKeys = (obj) => {
    const sanitizedObj = {};
    for (const key in obj) {
        const trimmedKey = key.trim(); // Trim the key
        sanitizedObj[trimmedKey] = obj[key];
    }
    return sanitizedObj;
};

const registerUser = asyncHandler(async (req, res) => {
    req.body = sanitizeKeys(req.body); // Sanitize keys
    const { username, email, fullName, password } = req.body;

    if (!username || !email || !fullName || !password) {
        throw new ApiError(400, "All fields are required.");
    }


 // if ([ username, email, fullName, password ].some((field) => field?.trim() === "")
    //     ) {
    //     throw new ApiError(400, "All fields are required."); 
    // }

 
    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    
    if(existedUser){
        throw new ApiError(409, "User with email Or Username already existed")
    }



const avatarLocalPath = req.files?.avatar[0]?.path   
    //  const coverImageLocalPath = req.files?.coverImage[0]?.path 

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].path){

        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }



    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400, "Avatar image is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        username,
        password,
    })



    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering user")
}

return res.status(201).json(
    new ApiResponce(200, createdUser, "User register successfully")
)





});




    const generateAccessAndRefreshToken = async (userId) => {

        try {
            const user = await User.findById(userId)

            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave : false })

            return {accessToken, refreshToken}

            
        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating refresh and access token")
        }

}




    const loginUser = asyncHandler(async (req, res) => {

    const {username, email, password } = req.body 

    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required")
    }


    const user = await User.findOne({
        $or : [{username}, {email}]
    })


    if(!user){
        throw new ApiError(400, "User dose not exist")
    }


    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }


    const {accessToken, refreshToken} = 
    await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User
    .findById(user._id)
    .select("-password -refreshToken")


    const options = {
        httpOnly : true,
        secure: true
    }


    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponce(
            200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    )

})




    const logoutUser = asyncHandler(async(req, res) => {

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken:1
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly : true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options )
        .clearCookie("refreshToken", options)
        .json(new ApiResponce(200, {}, "User logged Out Succesfully !"))
        

})




    const refreshAccessToken = asyncHandler(async(req, res) => {

        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken){
            throw new ApiError(401,"unauthorised request")
        }


        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
            if(!decodedToken){
                throw new ApiError(401, "token not verified")
            }
            
            const user = await User.findById(decodedToken?._id)
    
            if (!user) {
                throw new ApiError(401, "Invalid refresh token");
            }
    
    
            if(incomingRefreshToken !== user?.refreshToken ){
                throw new ApiError(401, "Refresh token is expired or used")
            }
    
    
            const { accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("RefreshToken", newRefreshToken, options)
            .json(
                new ApiResponce(
                    200,
                    {accessToken, newRefreshToken},
                    "Access token refreshed successfully"
                )
            )
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }

})



    const changeCurrentPassword = asyncHandler(async (req, res) => {

        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req.user?._id)

        
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid old passsword")
        }

        user.password = newPassword

        await user.save({validateBeforeSave : false})

        return res
        .status(200)
        .json(
          new ApiResponce(200, {}, "Password updated successfully")
        )
})





    const getCurrentUser = asyncHandler(async (req, res) => {

    return res
    .status(200)
    .json( 
        new ApiResponce(
        200,
        req.user,
        "User Fetched successfully "
    ));
});



    const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body; 

    if (!fullName || !email) {
        throw new ApiError(400, "Fullname and Email both are required");
    }

    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        {
            new: true,
        }
    ).select("-password");


    return res.status(200).json(
        new ApiResponce(200, user, "Account Details updated")
    );
});





    const updateUserCoverImage = asyncHandler(async (req, res) => {

     const coverImageLocalpath = req.file?.path

    if(!coverImageLocalpath){
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage.url){
        throw new ApiError(400, "Error While uploading avatar")
    }







    const user = await User.findByIdAndUpdate(
    req.user?._id,
        {
            $set :{
                coverImage:coverImage.url
            }
        },
        {
            new :true
        }
    ).select("-password")



        return res
        .status(200)
        .json(
            new ApiResponce(200, user, "CoverImage updated succesfully")
        )



})





    const updateUserAvatar = asyncHandler(async (req, res) => {

     const avatarLocalpath = req.file?.path

    if(!avatarLocalpath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)

    if(!avatar.url){
        throw new ApiError(400, "Error While uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
    req.user?._id,
        {
            $set :{
                avatar:avatar.url
            }
        },
        {
            new :true
        }
    ).select("-password")



    return res
    .status(200)
    .json(
        new ApiResponce(200, user, "Avatar updated succesfully")
    )



})



    const getUserChannalProfile = asyncHandler(async (req, res) =>{

    const {username} =  req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
            {
                $match: {
                    username: username.trim(),
                }
                
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    
                    channelSubscribedTo : {
                        $size:"$subscribedTo"
                    },
                    isSubscribedto:{
                        $cond:{
                            if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{
                    fullName:1,
                    username:1,
                    email:1,
                    subscribersCount:1,
                    channelSubscribedTo:1,
                    isSubscribedto:1,
                    avatar:1,
                    coverImage:1,
                }
            }
    ])

    if(!channel?.length){
        throw new ApiError(400, "Channel dose not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponce(
            200,
            channel[0],
            "User channel fetched Succesfully"
        )
    )


    })





    const getWatchHistory = asyncHandler(async(req, res) => {
        const user = await User.aggregate([
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                           $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                           }
                        }
                    ]
                }
            }
        ])

        return res
        .status(200)
        .json(
            new ApiResponce(
                200,
                user[0].watchHistory,
                "Watch history fetched succesfully"
            )
        )
    })


    export { 
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannalProfile,
        getWatchHistory
     };
